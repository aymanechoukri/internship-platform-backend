import AppError from "../../../utils/AppError.js";
import Internship from "../../../models/Internship.js";
import Company from "../../../models/Companies.js";

export const createInternship = async (userId, internshipData = {}) => {
  const company = await Company.findOne({ user: userId });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  return Internship.create({
    company: company._id,
    ...internshipData,
  });
};

export const getAllInternship = async (userId) => {
  const internship = await Internship.find()
    .populate({
      path: "company",
      populate: {
        path: "user",
        select: "name email role",
      },
    })
    .sort({ createdAt: -1 });

  return internship;
};

export const getInternshipById = async (id) => {
  const internship = await Internship.findById(id).populate({
    path: "company",
    populate: {
      path: "user",
      select: "name email role",
    },
  });

  if (!internship) {
    throw new AppError("Internship Not Found", 404);
  }

  return internship;
};
