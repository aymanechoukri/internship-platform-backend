import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";
import {
  creatApplication,
  getInternshipApplications,
  getMyApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "./application.controller.js";

const router = express.Router();

router.post("/:internshipId", protect, authorize("student"), creatApplication);
router.get("/me", protect, authorize("student"), getMyApplications);
router.get(
  "/internship/:internshipId",
  protect,
  authorize("company"),
  getInternshipApplications,
);
router.patch(
  "/:applicationId/status",
  protect,
  authorize("company"),
  updateApplicationStatus,
);
router.delete(
  "/:applicationId",
  protect,
  authorize("student"),
  withdrawApplication,
);

export default router;
