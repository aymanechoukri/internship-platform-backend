import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/authorize.middleware.js";
import {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "./notification.controller.js";
import { validateCreateNotification } from "./notification.validation.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize(["admin"]),
  validateCreateNotification,
  createNotification,
);

router.get("/me", protect, authorize(["student", "company", "admin"]), getMyNotifications);

router.patch(
  "/:notificationId/read",
  protect,
  authorize(["student", "company", "admin"]),
  markNotificationAsRead,
);

router.patch(
  "/read-all",
  protect,
  authorize(["student", "company", "admin"]),
  markAllNotificationsAsRead,
);

router.delete(
  "/:notificationId",
  protect,
  authorize(["student", "company", "admin"]),
  deleteNotification,
);

export default router;
