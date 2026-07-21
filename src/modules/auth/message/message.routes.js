import express from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/authorize.middleware.js";
import {
  sendMessage,
  getConversation,
  getRecentConversations,
} from "./message.controller.js";

const router = express.Router();

router.post("/", protect, authorize(["student", "company", "admin"]), sendMessage);
router.get("/conversation/:userId", protect, authorize(["student", "company", "admin"]), getConversation);
router.get("/recent", protect, authorize(["student", "company", "admin"]), getRecentConversations);

export default router;
