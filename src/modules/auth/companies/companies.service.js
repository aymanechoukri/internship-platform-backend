import AppError from "../../../utils/AppError.js";
import Company from "../../../models/Companies.js";
import Internship from "../../../models/Internship.js";
import Application from "../../../models/application.js";
import Notification from "../../../models/Notification.js";

const COMPANY_FIELDS = ["companyName", "website", "location", "industry", "description"];

const sanitizeCompany = (data = {}) => {
  const safe = {};
  for (const key of COMPANY_FIELDS) {
    if (data[key] !== undefined) safe[key] = typeof data[key] === "string" ? data[key].trim() : data[key];
  }
  if (safe.companyName !== undefined && safe.companyName.length < 2) {
    throw new AppError("Company name must contain at least 2 characters", 400);
  }
  if (safe.website) {
    try {
      const url = new URL(safe.website);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol");
    } catch {
      throw new AppError("Please provide a valid company website URL", 400);
    }
  }
  return safe;
};

export const createCompany = async (userId, companyData = {}) => {
  const existingCompany = await Company.findOne({ user: userId });
  if (existingCompany) throw new AppError("Company already exists", 400);
  const safeData = sanitizeCompany(companyData);
  if (!safeData.companyName) throw new AppError("Company name is required", 400);
  return Company.create({ user: userId, ...safeData, verificationStatus: "pending" });
};

export const getCompanyByUserId = async (userId) => {
  const company = await Company.findOne({ user: userId }).populate("user", "name email role");
  if (!company) throw new AppError("Company not found", 404);
  return company;
};

export const updateCompanyByUserId = async (userId, updateData = {}) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company not found", 404);
  const safeData = sanitizeCompany(updateData);
  const changed = Object.entries(safeData).some(([key, value]) => company[key] !== value);
  for (const [key, value] of Object.entries(safeData)) company[key] = value;

  // Any material profile change invalidates a previous review.
  if (changed && company.verificationStatus !== "pending") {
    company.verificationStatus = "pending";
    company.reviewedAt = null;
    company.reviewedBy = null;
    company.rejectionReason = "";
    await Notification.create({
      user: userId,
      title: "Company profile submitted for review",
      content: "Your company details changed. An administrator must review the updated profile before you can publish internships.",
    });
  }
  await company.save();
  return company.populate("user", "name email role");
};

export const deleteCompanyByUserId = async (userId) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company not found", 404);
  const internshipIds = await Internship.find({ company: company._id }).distinct("_id");
  const applicationsCount = await Application.countDocuments({ internship: { $in: internshipIds } });
  if (internshipIds.length || applicationsCount) {
    throw new AppError("This company has internship or application history. Contact an administrator to close the account safely.", 409);
  }
  await company.deleteOne();
};

export const getCompanyDashboard = async (userId) => {
  const company = await Company.findOne({ user: userId }).populate("user", "name email role");
  if (!company) throw new AppError("Complete your company profile to access the dashboard", 404);

  const internships = await Internship.find({ company: company._id }).sort({ createdAt: -1 }).lean();
  const internshipIds = internships.map((item) => item._id);
  const applications = await Application.find({ internship: { $in: internshipIds } })
    .populate({
      path: "student",
      select: "university major faculty graduationYear phone bio",
      populate: { path: "user", select: "name email" },
    })
    .populate({ path: "internship", select: "title" })
    .sort({ createdAt: -1 })
    .lean();

  const statusCounts = applications.reduce((counts, application) => {
    const key = application.status || "Pending";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, { Pending: 0, Accepted: 0, Rejected: 0 });

  const counts = await Application.aggregate([
    { $match: { internship: { $in: internshipIds } } },
    { $group: { _id: "$internship", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
  const ownedInternships = internships.map((item) => ({
    ...item,
    applicationsCount: countMap.get(String(item._id)) ?? 0,
  }));

  return {
    company,
    summary: {
      totalInternships: internships.length,
      activeInternships: internships.filter((item) => item.isActive && item.moderationStatus === "approved").length,
      pendingInternships: internships.filter((item) => item.moderationStatus === "pending" || !item.moderationStatus).length,
      totalApplications: applications.length,
      pendingApplications: statusCounts.Pending,
      acceptedApplications: statusCounts.Accepted,
      rejectedApplications: statusCounts.Rejected,
    },
    internships: ownedInternships,
    recentApplications: applications.slice(0, 8),
  };
};
