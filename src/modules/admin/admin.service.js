import AppError from "../../utils/AppError.js";
import User from "../../models/User.js";
import Student from "../../models/Student.js";
import Company from "../../models/Companies.js";
import Internship from "../../models/Internship.js";
import Application from "../../models/application.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const buildPage = (items, total, page, limit) => ({
  items,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});

export const getOverview = async () => {
  const [
    totalUsers,
    students,
    companies,
    totalInternships,
    activeInternships,
    totalApplications,
    pendingApplications,
    acceptedApplications,
    rejectedApplications,
    recentUsers,
    recentInternships,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "company" }),
    Internship.countDocuments(),
    Internship.countDocuments({ isActive: true }),
    Application.countDocuments(),
    Application.countDocuments({ status: "Pending" }),
    Application.countDocuments({ status: "Accepted" }),
    Application.countDocuments({ status: "Rejected" }),
    User.find().select("name email role isActive createdAt").sort({ createdAt: -1 }).limit(5).lean(),
    Internship.find()
      .select("title location type isActive createdAt company")
      .populate({ path: "company", select: "companyName user", populate: { path: "user", select: "name email" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    stats: {
      totalUsers,
      students,
      companies,
      totalInternships,
      activeInternships,
      inactiveInternships: totalInternships - activeInternships,
      totalApplications,
      applications: {
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
      },
    },
    recentUsers,
    recentInternships,
  };
};

export const listUsers = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (["student", "company", "admin"].includes(query.role)) filter.role = query.role;
  if (query.status === "active") filter.isActive = true;
  if (query.status === "disabled") filter.isActive = false;
  if (typeof query.search === "string" && query.search.trim()) {
    const pattern = new RegExp(escapeRegex(query.search.trim().slice(0, 80)), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("name email role isActive createdAt updatedAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return buildPage(users, total, page, limit);
};

export const setUserStatus = async (adminId, userId, isActive) => {
  if (typeof isActive !== "boolean") throw new AppError("isActive must be a boolean", 400);
  if (String(adminId) === String(userId) && !isActive) {
    throw new AppError("You cannot disable your own administrator account", 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.role === "admin" && user.isActive !== false && !isActive) {
    const activeAdmins = await User.countDocuments({ role: "admin", isActive: true });
    if (activeAdmins <= 1) throw new AppError("The last active administrator cannot be disabled", 400);
  }

  user.isActive = isActive;
  await user.save();
  return user.toObject({ versionKey: false });
};

export const listCompanies = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (typeof query.search === "string" && query.search.trim()) {
    const pattern = new RegExp(escapeRegex(query.search.trim().slice(0, 80)), "i");
    filter.$or = [{ companyName: pattern }, { location: pattern }, { industry: pattern }];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate({ path: "user", select: "name email role isActive createdAt" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Company.countDocuments(filter),
  ]);
  return buildPage(companies, total, page, limit);
};

export const listInternships = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.status === "active") filter.isActive = true;
  if (query.status === "inactive") filter.isActive = false;
  if (typeof query.search === "string" && query.search.trim()) {
    const pattern = new RegExp(escapeRegex(query.search.trim().slice(0, 80)), "i");
    filter.$or = [{ title: pattern }, { location: pattern }, { description: pattern }];
  }

  const [internships, total] = await Promise.all([
    Internship.find(filter)
      .populate({ path: "company", select: "companyName location user", populate: { path: "user", select: "name email" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Internship.countDocuments(filter),
  ]);
  return buildPage(internships, total, page, limit);
};

export const setInternshipStatus = async (internshipId, isActive) => {
  if (typeof isActive !== "boolean") throw new AppError("isActive must be a boolean", 400);
  const internship = await Internship.findById(internshipId);
  if (!internship) throw new AppError("Internship not found", 404);
  internship.isActive = isActive;
  await internship.save();
  return internship;
};
