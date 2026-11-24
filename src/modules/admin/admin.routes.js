import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import {
  getOverview,
  listUsers,
  setUserStatus,
  listCompanies,
  listInternships,
  setInternshipStatus,
} from "./admin.controller.js";

const router = express.Router();

router.use(protect, authorize(["admin"]));

router.get("/overview", getOverview);
router.get("/users", listUsers);
router.patch("/users/:userId/status", setUserStatus);
router.get("/companies", listCompanies);
router.get("/internships", listInternships);
router.patch("/internships/:internshipId/status", setInternshipStatus);

export default router;
