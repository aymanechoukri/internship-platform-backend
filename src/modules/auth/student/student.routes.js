import express from "express";
import { createStudent, getStudentByUserId } from "./student.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("student"), createStudent);
router.get("/me", protect, authorize("student"), getStudentByUserId);
export default router;
