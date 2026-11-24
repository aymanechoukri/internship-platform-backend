import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";
import {
  createInternshipById,
  deleteInternshipById,
  getAllInternship,
  getCompanyInternships,
  getInternshipById,
  updateInternshipById,
} from "./internship.controller.js";

const router = express.Router();

router.post("/", protect, authorize("company"), createInternshipById);
router.get("/mine", protect, authorize("company"), getCompanyInternships);
router.get("/", getAllInternship);
router.get("/:id", getInternshipById);
router.put("/:id", protect, authorize("company"), updateInternshipById);
router.delete("/:id", protect, authorize("company"), deleteInternshipById);

export default router;
