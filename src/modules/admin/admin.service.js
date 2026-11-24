import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import User from "../../models/User.js";
import Student from "../../models/Student.js";
import Company from "../../models/Companies.js";
import Internship from "../../models/Internship.js";
import Application from "../../models/application.js";
import Notification from "../../models/Notification.js";
import AdminLog from "../../models/AdminLog.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const getPagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
};
const buildPage = (items, total, page, limit) => ({
  items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
});
const logAction = (adminId, action, targetType, targetId, details = "") =>
  AdminLog.create({ admin: adminId, action, targetType, targetId, details });
const notify = (userId, title, content) =>
  Notification.create({ user: userId, title, content });

export const getOverview = async () => {
  const [totalUsers, students, companies, pendingCompanies, approvedCompanies, totalInternships,
    activeInternships, pendingInternships, totalApplications, pendingApplications, acceptedApplications,
    rejectedApplications, recentUsers, recentInternships] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: "student" }), User.countDocuments({ role: "company" }),
    Company.countDocuments({ verificationStatus: "pending" }), Company.countDocuments({ verificationStatus: "approved" }),
    Internship.countDocuments(), Internship.countDocuments({ isActive: true }),
    Internship.countDocuments({ moderationStatus: "pending" }), Application.countDocuments(),
    Application.countDocuments({ status: "Pending" }), Application.countDocuments({ status: "Accepted" }),
    Application.countDocuments({ status: "Rejected" }),
    User.find().select("name email role isActive createdAt").sort({ createdAt: -1 }).limit(5).lean(),
    Internship.find().select("title location type isActive moderationStatus createdAt company")
      .populate({ path: "company", select: "companyName user", populate: { path: "user", select: "name email" } })
      .sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  return {
    stats: { totalUsers, students, companies, pendingCompanies, approvedCompanies, totalInternships,
      activeInternships, inactiveInternships: totalInternships - activeInternships, pendingInternships,
      totalApplications, applications: { pending: pendingApplications, accepted: acceptedApplications, rejected: rejectedApplications } },
    recentUsers, recentInternships,
  };
};

export const listUsers = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (["student", "company", "admin"].includes(query.role)) filter.role = query.role;
  if (query.status === "active") filter.isActive = { $ne: false };
  if (query.status === "disabled") filter.isActive = false;
  if (query.search?.trim()) {
    const pattern = new RegExp(escapeRegex(query.search.trim().slice(0, 80)), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select("name email role isActive createdAt updatedAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return buildPage(users, total, page, limit);
};

export const updateUser = async (adminId, userId, data = {}) => {
  if (!mongoose.isValidObjectId(userId)) throw new AppError("Invalid user ID", 400);
  const allowed = ["name", "email"];
  const updates = Object.keys(data);
  if (!updates.length || updates.some((key) => !allowed.includes(key))) {
    throw new AppError("Only name and email can be edited here; role changes require a dedicated migration", 400);
  }
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length < 2) throw new AppError("Name must contain at least 2 characters", 400);
    user.name = data.name.trim();
  }
  if (data.email !== undefined) {
    if (typeof data.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw new AppError("A valid email is required", 400);
    const email = data.email.trim().toLowerCase();
    const duplicate = await User.findOne({ email, _id: { $ne: userId } });
    if (duplicate) throw new AppError("This email is already in use", 409);
    user.email = email;
  }
  await user.save();
  await logAction(adminId, "user.updated", "User", user._id, updates.join(", "));
  return user.toObject({ versionKey: false });
};

export const setUserStatus = async (adminId, userId, isActive) => {
  if (typeof isActive !== "boolean") throw new AppError("isActive must be a boolean", 400);
  if (String(adminId) === String(userId) && !isActive) throw new AppError("You cannot disable your own administrator account", 400);
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "admin" && user.isActive !== false && !isActive) {
    const activeAdmins = await User.countDocuments({ role: "admin", isActive: { $ne: false } });
    if (activeAdmins <= 1) throw new AppError("The last active administrator cannot be disabled", 400);
  }
  user.isActive = isActive;
  await user.save();
  await logAction(adminId, isActive ? "user.enabled" : "user.disabled", "User", user._id);
  return user.toObject({ versionKey: false });
};

export const deleteUser = async (adminId, userId) => {
  if (!mongoose.isValidObjectId(userId)) throw new AppError("Invalid user ID", 400);
  if (String(adminId) === String(userId)) throw new AppError("You cannot delete your own administrator account", 400);
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "admin") {
    const admins = await User.countDocuments({ role: "admin" });
    if (admins <= 1) throw new AppError("The last administrator cannot be deleted", 400);
  }

  if (user.role === "student") {
    const student = await Student.findOne({ user: user._id });
    if (student) await Application.deleteMany({ student: student._id });
    await Student.deleteMany({ user: user._id });
  }
  if (user.role === "company") {
    const company = await Company.findOne({ user: user._id });
    if (company) {
      const internships = await Internship.find({ company: company._id }).select("_id");
      const internshipIds = internships.map((item) => item._id);
      await Application.deleteMany({ internship: { $in: internshipIds } });
      await Internship.deleteMany({ company: company._id });
    }
    await Company.deleteMany({ user: user._id });
  }
  await Notification.deleteMany({ user: user._id });
  await user.deleteOne();
  await logAction(adminId, "user.deleted", "User", user._id, "Related student/company profiles, internships and applications were deleted.");
  return { id: userId, deleted: true };
};

export const listCompanies = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.status === "pending") filter.$and = [{ $or: [{ verificationStatus: "pending" }, { verificationStatus: { $exists: false } }] }];
  if (["approved", "rejected"].includes(query.status)) filter.verificationStatus = query.status;
  if (query.search?.trim()) {
    const pattern = new RegExp(escapeRegex(query.search.trim().slice(0, 80)), "i");
    filter.$and = [...(filter.$and ?? []), { $or: [{ companyName: pattern }, { location: pattern }, { industry: pattern }] }];
  }
  const [companies, total] = await Promise.all([
    Company.find(filter).populate({ path: "user", select: "name email role isActive createdAt" })
      .populate({ path: "reviewedBy", select: "name email" }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter),
  ]);
  return buildPage(companies, total, page, limit);
};

export const reviewCompany = async (adminId, companyId, decision, reason = "") => {
  if (!["approved", "rejected"].includes(decision)) throw new AppError("Decision must be approved or rejected", 400);
  if (decision === "rejected" && (!reason.trim() || reason.trim().length < 5)) throw new AppError("Please provide a rejection reason (at least 5 characters)", 400);
  const company = await Company.findById(companyId);
  if (!company) throw new AppError("Company not found", 404);
  company.verificationStatus = decision;
  company.reviewedAt = new Date();
  company.reviewedBy = adminId;
  company.rejectionReason = decision === "rejected" ? reason.trim().slice(0, 500) : "";
  await company.save();
  await notify(company.user, decision === "approved" ? "Company verified" : "Company verification rejected",
    decision === "approved" ? "Your company profile has been approved. You can now publish internship opportunities." : `Your company profile was rejected: ${company.rejectionReason}`);
  await logAction(adminId, `company.${decision}`, "Company", company._id, company.rejectionReason);
  return company;
};

export const listInternships = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (["active", "inactive"].includes(query.status)) filter.isActive = query.status === "active";
  if (query.moderationStatus === "pending") filter.$and = [{ $or: [{ moderationStatus: "pending" }, { moderationStatus: { $exists: false } }] }];
  if (["approved", "rejected"].includes(query.moderationStatus)) filter.moderationStatus = query.moderationStatus;
  if (query.search?.trim()) {
    const pattern = new RegExp(escapeRegex(query.search.trim().slice(0, 80)), "i");
    filter.$and = [...(filter.$and ?? []), { $or: [{ title: pattern }, { location: pattern }, { description: pattern }] }];
  }
  const [internships, total] = await Promise.all([
    Internship.find(filter).populate({ path: "company", select: "companyName location user", populate: { path: "user", select: "name email" } })
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Internship.countDocuments(filter),
  ]);
  return buildPage(internships, total, page, limit);
};

export const setInternshipStatus = async (adminId, internshipId, isActive) => {
  if (typeof isActive !== "boolean") throw new AppError("isActive must be a boolean", 400);
  const internship = await Internship.findById(internshipId);
  if (!internship) throw new AppError("Internship not found", 404);
  if (isActive && !["approved", undefined].includes(internship.moderationStatus)) {
    throw new AppError("Only approved internships can be published", 400);
  }
  if (isActive) {
    const company = await Company.findById(internship.company);
    if (company && !["approved", undefined].includes(company.verificationStatus)) {
      throw new AppError("Only verified companies can publish internships", 400);
    }
  }
  internship.isActive = isActive;
  await internship.save();
  await logAction(adminId, isActive ? "internship.published" : "internship.paused", "Internship", internship._id);
  return internship;
};

export const reviewInternship = async (adminId, internshipId, decision, reason = "") => {
  if (!["approved", "rejected"].includes(decision)) throw new AppError("Decision must be approved or rejected", 400);
  if (decision === "rejected" && (!reason.trim() || reason.trim().length < 5)) throw new AppError("Please provide a rejection reason (at least 5 characters)", 400);
  const internship = await Internship.findById(internshipId).populate("company");
  if (!internship) throw new AppError("Internship not found", 404);
  internship.moderationStatus = decision;
  internship.isActive = decision === "approved";
  internship.reviewedAt = new Date();
  internship.reviewedBy = adminId;
  internship.moderationReason = decision === "rejected" ? reason.trim().slice(0, 500) : "";
  await internship.save();
  if (internship.company?.user) await notify(internship.company.user, decision === "approved" ? "Internship approved" : "Internship rejected",
    decision === "approved" ? `Your internship “${internship.title}” has been approved.` : `Your internship “${internship.title}” was rejected: ${internship.moderationReason}`);
  await logAction(adminId, `internship.${decision}`, "Internship", internship._id, internship.moderationReason);
  return internship;
};

export const listApplications = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (["Pending", "Accepted", "Rejected"].includes(query.status)) filter.status = query.status;
  const [applications, total] = await Promise.all([
    Application.find(filter).populate({ path: "student", populate: { path: "user", select: "name email" } })
      .populate({ path: "internship", populate: { path: "company", select: "companyName" } })
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);
  return buildPage(applications, total, page, limit);
};

export const sendNotification = async (adminId, payload = {}) => {
  const { userId, title, content, audience } = payload;
  if (!title?.trim() || !content?.trim()) throw new AppError("Title and content are required", 400);
  let recipients;
  if (userId) {
    const user = await User.findById(userId).select("_id");
    if (!user) throw new AppError("User not found", 404);
    recipients = [user._id];
  } else if (["all", "students", "companies"].includes(audience)) {
    const filter = audience === "all" ? {} : { role: audience === "students" ? "student" : "company" };
    recipients = await User.find(filter).select("_id").lean();
  } else {
    throw new AppError("Choose a user or a valid audience", 400);
  }
  if (recipients.length > 5000) throw new AppError("Audience is too large for a single broadcast", 400);
  const docs = recipients.map((recipient) => ({ user: recipient._id ?? recipient, title: title.trim().slice(0, 120), content: content.trim().slice(0, 2000) }));
  if (docs.length) await Notification.insertMany(docs);
  await logAction(adminId, "notification.sent", "Notification", null, `Sent to ${docs.length} account(s)`);
  return { sent: docs.length };
};

export const listAdminLogs = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const [logs, total] = await Promise.all([
    AdminLog.find().populate("admin", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminLog.countDocuments(),
  ]);
  return buildPage(logs, total, page, limit);
};
