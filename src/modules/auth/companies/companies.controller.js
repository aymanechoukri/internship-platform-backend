import asyncHandler from "../../../utils/asyncHandler.js";
import * as companyService from "./companies.service.js";

export const createCompany = asyncHandler(async (req, res) => {
  const company = await companyService.createCompany(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Company created Successfully",
    data: company,
  });
});

export const getCompanyByUserId = asyncHandler(async (req, res) => {
  const company = await companyService.getCompanyByUserId(req.user._id);

  res.status(200).json({
    success: true,
    message: "Company retrieved Successfully",
    data: company,
  });
});

export const updateCompanyByUserId = asyncHandler(async (req, res) => {
  const company = await companyService.updateCompanyByUserId(
    req.user._id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Company updated Successfully",
    data: company,
  });
});

export const deleteCompany = asyncHandler(async (req, res) => {
  await companyService.deleteCompanyByUserId(req.user._id);

  res.status(200).json({
    success: true,
    message: "Company deleted successfully",
  });
});
