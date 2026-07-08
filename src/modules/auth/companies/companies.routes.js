import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";
import { createCompany } from "./companies.controller.js";

const router = express.Router();

router.post("/", protect, authorize("company"), createCompany);

export default router;