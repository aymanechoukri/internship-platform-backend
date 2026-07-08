import express from "express";
import {
  createStudent,
  getStudentByUserId,
  updateStudentByUserId,
  deleteStudentByUserId
} from "./student.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("student"), createStudent);
router.get("/me", protect, authorize("student"), getStudentByUserId);
router.put("/me", protect, authorize("student"), updateStudentByUserId);
router.delete("/me", protect, authorize("student"), deleteStudentByUserId);

export default router;
