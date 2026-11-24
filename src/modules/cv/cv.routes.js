import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import { uploadSingleCV } from "../../middleware/upload.middleware.js";
import {
  uploadCV,
  getMyCVs,
  getCVById,
  downloadCV,
  deleteCV,
  downloadApplicantCV,
} from "./cv.controller.js";

const router = express.Router();

router.get("/applicant/:cvId/download", protect, authorize(["company"]), downloadApplicantCV);
router.post("/", protect, authorize(["student"]), uploadSingleCV, uploadCV);
router.get("/me", protect, authorize(["student"]), getMyCVs);
router.get("/:cvId/download", protect, authorize(["student"]), downloadCV);
router.get("/:cvId", protect, authorize(["student"]), getCVById);
router.delete("/:cvId", protect, authorize(["student"]), deleteCV);

export default router;
