import asyncHandler from "../../../utils/asyncHandler.js";
import * as applicationService from "./application.service.js";

export const creatApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.creatApplication(
    req.user._id,
    req.params.internshipId,
  );

  res.status(201).json({
    success: true,
    message: "Application created successfully",
    data: application,
  });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getMyApplications(req.user._id);

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications,
  });
});

export const getInternshipApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getInternshipApplications(
    req.user._id,
    req.params.internshipId,
  );

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications,
  });
});
