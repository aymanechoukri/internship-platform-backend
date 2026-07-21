import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import { uploadSingleCV } from "../../middleware/upload.middleware.js";
import {
  uploadCV,
  getMyCVs,
  getCVById,
  deleteCV,
} from "./cv.controller.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize(["student"]),
  uploadSingleCV,
  uploadCV,
);

router.get("/me", protect, authorize(["student"]), getMyCVs);
router.get("/:cvId", protect, authorize(["student"]), getCVById);
router.delete("/:cvId", protect, authorize(["student"]), deleteCV);

export default router;
