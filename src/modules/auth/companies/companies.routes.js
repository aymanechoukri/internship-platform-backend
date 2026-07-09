import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";
import { createCompany, getCompanyByUserId } from "./companies.controller.js";

const router = express.Router();

router.post("/", protect, authorize("company"), createCompany);
router.get("/me", protect, authorize("company"), getCompanyByUserId);

export default router;