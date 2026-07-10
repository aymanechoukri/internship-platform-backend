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
