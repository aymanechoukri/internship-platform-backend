import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";
import { creatApplication, getMyApplications } from "./application.controller.js";

const router = express.Router();

router.post("/:internshipId", protect, authorize("student"), creatApplication);
router.get("/me", protect, authorize("student"), getMyApplications);

export default router;
