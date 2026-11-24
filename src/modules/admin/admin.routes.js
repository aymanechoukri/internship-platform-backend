import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import {
  getOverview, listUsers, updateUser, setUserStatus, deleteUser,
  listCompanies, reviewCompany, listInternships, setInternshipStatus,
  reviewInternship, listApplications, sendNotification, listAdminLogs,
} from "./admin.controller.js";

const router = express.Router();
router.use(protect, authorize(["admin"]));
router.get("/overview", getOverview);
router.get("/users", listUsers);
router.patch("/users/:userId", updateUser);
router.patch("/users/:userId/status", setUserStatus);
router.delete("/users/:userId", deleteUser);
router.get("/companies", listCompanies);
router.patch("/companies/:companyId/review", reviewCompany);
router.get("/internships", listInternships);
router.patch("/internships/:internshipId/status", setInternshipStatus);
router.patch("/internships/:internshipId/review", reviewInternship);
router.get("/applications", listApplications);
router.post("/notifications", sendNotification);
router.get("/logs", listAdminLogs);
export default router;
