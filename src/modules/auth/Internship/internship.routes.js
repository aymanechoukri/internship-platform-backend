import express, { Router } from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";
import { createInternshipById } from "./internship.controller.js";

const router = express.Router();

router.post("/", protect, authorize("company"), createInternshipById);

export default router;
