import asyncHandler from "../../utils/asyncHandler.js";
import * as adminService from "./admin.service.js";

export const getOverview = asyncHandler(async (req, res) => {
  const data = await adminService.getOverview();
  res.status(200).json({ success: true, data });
});

export const listUsers = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.status(200).json({ success: true, data });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.setUserStatus(req.user._id, req.params.userId, req.body.isActive);
  res.status(200).json({ success: true, message: "User status updated successfully", data: user });
});

export const listCompanies = asyncHandler(async (req, res) => {
  const data = await adminService.listCompanies(req.query);
  res.status(200).json({ success: true, data });
});

export const listInternships = asyncHandler(async (req, res) => {
  const data = await adminService.listInternships(req.query);
  res.status(200).json({ success: true, data });
});

export const setInternshipStatus = asyncHandler(async (req, res) => {
  const internship = await adminService.setInternshipStatus(req.params.internshipId, req.body.isActive);
  res.status(200).json({ success: true, message: "Internship status updated successfully", data: internship });
});
