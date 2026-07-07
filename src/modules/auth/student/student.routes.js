import express from "express";
import { createStudent } from "./student.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("student"), createStudent);

export default router;
