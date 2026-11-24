import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";
import {
  createCompany,
  deleteCompany,
  getCompanyByUserId,
  getCompanyDashboard,
  updateCompanyByUserId,
} from "./companies.controller.js";

const router = express.Router();

router.post("/", protect, authorize("company"), createCompany);
router.get("/me", protect, authorize("company"), getCompanyByUserId);
router.get("/dashboard", protect, authorize("company"), getCompanyDashboard);
router.put("/me", protect, authorize("company"), updateCompanyByUserId);
router.delete("/me", protect, authorize("company"), deleteCompany);

export default router;
