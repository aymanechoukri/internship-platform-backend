import AppError from "../../../utils/AppError.js";
import Company from "../../../models/Companies.js";

export const createCompany = async (userId, companyData = {}) => {
  const existingCompany = await Company.findOne({
    user: userId,
  });

  if (existingCompany) {
    throw new AppError("Company already exists", 400);
  }

  return await Company.create({
    user: userId,
    ...companyData,
  });
};

export const getCompanyByUserId = async (userId) => {
  const company = await Company.findOne({
    user: userId,
  });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  await company.populate("user", "name email role");
  return company;
};
