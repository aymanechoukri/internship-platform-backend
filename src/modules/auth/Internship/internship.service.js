import AppError from "../../../utils/AppError.js";
import Internship from "../../../models/Internship.js";
import Company from "../../../models/Companies.js";

export const createInternship = async (userId, internshipData = {}) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company not found", 404);
  if (company.verificationStatus !== "approved") {
    throw new AppError("Your company must be approved by an administrator before publishing internships", 403);
  }

  return Internship.create({
    company: company._id,
    ...internshipData,
    isActive: false,
    moderationStatus: "pending",
  });
};

export const getAllInternship = async (query = {}) => {
  const approvedCompanyIds = await Company.distinct("_id", { verificationStatus: "approved" });
  const filter = {
    company: { $in: approvedCompanyIds },
    isActive: true,
    $or: [{ moderationStatus: "approved" }, { moderationStatus: { $exists: false } }],
  };
  if (query.search) filter.$and = [...(filter.$and ?? []), { $or: [
    { title: { $regex: query.search, $options: "i" } },
    { description: { $regex: query.search, $options: "i" } },
  ] }];
  if (query.location) filter.location = query.location;
  if (query.type) filter.type = query.type;
  if (query.skill) filter.skills = query.skill;

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
  const internship = await Internship.findOne({
    _id: id,
    isActive: true,
    $or: [{ moderationStatus: "approved" }, { moderationStatus: { $exists: false } }],
  }).populate({ path: "company", populate: { path: "user", select: "name email role" } });
  if (!internship || internship.company?.verificationStatus !== "approved") throw new AppError("Internship not found", 404);
  return internship;
};

export const updateInternship = async (userId, internshipId, updateData) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company not found", 404);
  if (company.verificationStatus !== "approved") throw new AppError("Your company is not approved", 403);
  const internship = await Internship.findById(internshipId);
  if (!internship) throw new AppError("Internship not found", 404);
  if (!internship.company.equals(company._id)) throw new AppError("You do not have permission to update this internship", 403);

  const allowed = ["title", "description", "location", "type", "duration", "salary", "skills", "deadline"];
  for (const key of allowed) if (updateData[key] !== undefined) internship[key] = updateData[key];
  internship.moderationStatus = "pending";
  internship.isActive = false;
  internship.reviewedAt = null;
  internship.reviewedBy = null;
  internship.moderationReason = "";
  await internship.save();
  return internship.populate({ path: "company", populate: { path: "user", select: "name email role" } });
};

export const deleteInernshipById = async (userId, internshipId) => {
  const company = await Company.findOne({ user: userId });
  if (!company) throw new AppError("Company not found", 404);
  const internship = await Internship.findById(internshipId);
  if (!internship) throw new AppError("Internship not found", 404);
  if (!internship.company.equals(company._id)) throw new AppError("You do not have permission to delete this internship", 403);
  await internship.deleteOne();
};
