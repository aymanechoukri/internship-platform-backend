import asyncHandler from "../../../utils/asyncHandler.js";
import * as internshipService from "./internship.service.js";

export const createInternshipById = asyncHandler(async (req, res) => {
  const internship = await internshipService.createInternship(
    req.user._id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Internship Created Successfully",
    data: internship,
  });
});

export const getAllInternship = asyncHandler(async (req, res) => {
  const result = await internshipService.getAllInternship(req.query);

  res.status(200).json({
    success: true,
    message: "Internships retrieved successfully",
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
    data: result.internships,
  });
});

export const getInternshipById = asyncHandler(async (req, res) => {
  const internship = await internshipService.getInternshipById(req.params.id);

  res.status(200).json({
    success: true,
    message: "Internship retrieved successfully",
    data: internship,
  });
});

export const updateInternshipById = asyncHandler(async (req, res) => {
  const internship = await internshipService.updateInternship(
    req.user._id,
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Internship updated successfully",
    data: internship,
  });
});

export const deleteInternshipById = asyncHandler(async (req, res) => {
  const internship = await internshipService.deleteInernshipById(
    req.user._id,
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: "Internship Delete successfully",
    data: internship,
  });
});
