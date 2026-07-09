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

export const updateCompanyByUserId = async (userId, updateData) => {
  const company = await Company.findOne({
    user: userId,
  });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  company.companyName = updateData.companyName ?? company.companyName;
  company.description = updateData.description ?? company.description;
  company.website = updateData.website ?? company.website;
  company.industry = updateData.industry ?? company.industry;
  company.location = updateData.location ?? company.location;

  await company.save();
  return await company.populate("user", "name email role");
};

export const deleteCompanyByUserId = async (userId) => {
  const company = await Company.findOne({ user: userId });

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  await company.deleteOne();
};
