import asyncHandler from "../../utils/asyncHandler.js";
import * as notificationService from "./notification.service.js";

export const createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification({
    userId: req.body.userId,
    title: req.body.title,
    content: req.body.content,
  });

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    data: notification,
  });
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getMyNotifications(req.user._id);

  res.status(200).json({
    success: true,
    count: result.notifications.length,
    unreadCount: result.unreadCount,
    data: result.notifications,
  });
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.user._id,
    req.params.notificationId,
  );

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(
    req.user._id,
    req.params.notificationId,
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
