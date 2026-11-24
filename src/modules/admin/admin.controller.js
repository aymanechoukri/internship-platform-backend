import asyncHandler from "../../utils/asyncHandler.js";
import * as adminService from "./admin.service.js";

export const getOverview = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await adminService.getOverview() }));
export const listUsers = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await adminService.listUsers(req.query) }));
export const updateUser = asyncHandler(async (req, res) => res.status(200).json({ success: true, message: "User updated successfully", data: await adminService.updateUser(req.user._id, req.params.userId, req.body) }));
export const setUserStatus = asyncHandler(async (req, res) => res.status(200).json({ success: true, message: "User status updated successfully", data: await adminService.setUserStatus(req.user._id, req.params.userId, req.body.isActive) }));
export const deleteUser = asyncHandler(async (req, res) => res.status(200).json({ success: true, message: "User and associated records deleted", data: await adminService.deleteUser(req.user._id, req.params.userId) }));
export const listCompanies = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await adminService.listCompanies(req.query) }));
export const reviewCompany = asyncHandler(async (req, res) => res.status(200).json({ success: true, message: "Company review saved", data: await adminService.reviewCompany(req.user._id, req.params.companyId, req.body.decision, req.body.reason ?? "") }));
export const listInternships = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await adminService.listInternships(req.query) }));
export const setInternshipStatus = asyncHandler(async (req, res) => res.status(200).json({ success: true, message: "Internship status updated", data: await adminService.setInternshipStatus(req.user._id, req.params.internshipId, req.body.isActive) }));
export const reviewInternship = asyncHandler(async (req, res) => res.status(200).json({ success: true, message: "Internship review saved", data: await adminService.reviewInternship(req.user._id, req.params.internshipId, req.body.decision, req.body.reason ?? "") }));
export const listApplications = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await adminService.listApplications(req.query) }));
export const sendNotification = asyncHandler(async (req, res) => res.status(201).json({ success: true, message: "Notification sent", data: await adminService.sendNotification(req.user._id, req.body) }));
export const listAdminLogs = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await adminService.listAdminLogs(req.query) }));
