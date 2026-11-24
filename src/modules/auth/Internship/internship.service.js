import mongoose from "mongoose";
import AppError from "../../../utils/AppError.js";
import Internship from "../../../models/Internship.js";
import Company from "../../../models/Companies.js";
import Application from "../../../models/application.js";

const allowedFields = ["title", "description", "location", "type", "duration", "salary", "skills", "deadline"];

const sanitizeInternship = (data = {}) => {
  const safe = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) safe[key] = data[key];
  }
  if (safe.title !== undefined) safe.title = String(safe.title).trim();
  if (safe.description !== undefined) safe.description = String(safe.description).trim();
  if (safe.location !== undefined) safe.location = String(safe.location).trim();
  if (safe.skills !== undefined) safe.skills = Array.isArray(safe.skills)
    ? safe.skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 30)
    : String(safe.skills).split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 30);
  if (safe.salary !== undefined) {
    safe.salary = Number(safe.salary);
    if (!Number.isFinite(safe.salary) || safe.salary < 0) throw new AppError("Salary must be a valid non-negative number", 400);
  }
  if (safe.deadline !== undefined && safe.deadline !== "") {
    const date = new Date(safe.deadline);
    if (Number.isNaN(date.getTime())) throw new AppError("Deadline must be a valid date", 400);
    safe.deadline = date;
  } else if (safe.deadline === "") {
    safe.deadline = undefined;
  }
  if (safe.title !== undefined && safe.title.length < 3) throw new AppError("Internship title must contain at least 3 characters", 400);
  if (safe.description !== undefined && safe.description.length < 20) throw new AppError("Description must contain at least 20 characters", 400);
  return safe;
};

const getApprovedCompany = async (userId) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Complete your company profile before managing internships", 404);
  if (company.verificationStatus !== "approved") {
    throw new AppError("Your company must be approved by an administrator before managing internships", 403);
  }
  return company;
};

export const createInternship = async (userId, internshipData = {}) => {
  const company = await getApprovedCompany(userId);
  const data = sanitizeInternship(internshipData);
  if (!data.title || !data.description) throw new AppError("Title and description are required", 400);

  return Internship.create({
    ...data,
    company: company._id,
    isActive: false,
    moderationStatus: "pending",
  });
};

export const getCompanyInternships = async (userId) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company profile not found", 404);

  const internships = await Internship.find({ company: company._id }).sort({ createdAt: -1 }).lean();
  const ids = internships.map((item) => item._id);
  const counts = await Application.aggregate([
    { $match: { internship: { $in: ids } } },
    { $group: { _id: "$internship", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
  const items = internships.map((item) => ({
    ...item,
    applicationsCount: countMap.get(String(item._id)) ?? 0,
  }));
  return {
    company,
    internships: items,
    summary: {
      total: items.length,
      active: items.filter((item) => item.isActive).length,
      pending: items.filter((item) => item.moderationStatus === "pending" || !item.moderationStatus).length,
      rejected: items.filter((item) => item.moderationStatus === "rejected").length,
    },
  };
};

export const getAllInternship = async (query = {}) => {
  const approvedCompanyIds = await Company.distinct("_id", { verificationStatus: "approved" });
  const filter = {
    company: { $in: approvedCompanyIds },
    isActive: true,
    $or: [{ moderationStatus: "approved" }, { moderationStatus: { $exists: false } }],
  };
  if (query.search) {
    const search = String(query.search).trim().slice(0, 80);
    const matchingCompanies = await Company.distinct("_id", {
      verificationStatus: "approved",
      companyName: { $regex: search, $options: "i" },
    });
    filter.$and = [...(filter.$and ?? []), { $or: [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { company: { $in: matchingCompanies } },
    ] }];
  }
  if (query.location) filter.location = { $regex: String(query.location).trim().slice(0, 80), $options: "i" };
  if (query.type) filter.type = query.type;
  if (query.skill) filter.skills = { $regex: String(query.skill).trim().slice(0, 60), $options: "i" };

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const total = await Internship.countDocuments(filter);
  const internships = await Internship.find(filter)
    .populate({ path: "company", populate: { path: "user", select: "name email role" } })
    .sort({ createdAt: -1 }).skip(skip).limit(limit);
  return { total, page, limit, internships };
};

export const getInternshipById = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Internship not found", 404);
  const internship = await Internship.findOne({
    _id: id,
    isActive: true,
    $or: [{ moderationStatus: "approved" }, { moderationStatus: { $exists: false } }],
  }).populate({ path: "company", populate: { path: "user", select: "name email role" } });
  if (!internship || internship.company?.verificationStatus !== "approved") throw new AppError("Internship not found", 404);
  return internship;
};

export const updateInternship = async (userId, internshipId, updateData = {}) => {
  const company = await getApprovedCompany(userId);
  if (!mongoose.isValidObjectId(internshipId)) throw new AppError("Internship not found", 404);
  const internship = await Internship.findById(internshipId);
  if (!internship) throw new AppError("Internship not found", 404);
  if (!internship.company.equals(company._id)) throw new AppError("You do not have permission to update this internship", 403);

  const data = sanitizeInternship(updateData);
  for (const [key, value] of Object.entries(data)) internship[key] = value;
  internship.moderationStatus = "pending";
  internship.isActive = false;
  internship.reviewedAt = null;
  internship.reviewedBy = null;
  internship.moderationReason = "";
  await internship.save();
  return internship;
};

export const deleteInternshipById = async (userId, internshipId) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company profile not found", 404);
  if (!mongoose.isValidObjectId(internshipId)) throw new AppError("Internship not found", 404);
  const internship = await Internship.findById(internshipId);
  if (!internship) throw new AppError("Internship not found", 404);
  if (!internship.company.equals(company._id)) throw new AppError("You do not have permission to delete this internship", 403);
  const applicationCount = await Application.countDocuments({ internship: internship._id });
  if (applicationCount > 0) {
    throw new AppError("This internship already has applications. Close it instead of deleting it to preserve application history.", 409);
  }
  await internship.deleteOne();
  return { id: internshipId, deleted: true };
};
