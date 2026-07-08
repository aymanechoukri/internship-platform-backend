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
