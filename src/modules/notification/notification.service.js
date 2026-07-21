import AppError from "../../utils/AppError.js";
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";

export const createNotification = async (payload) => {
  const { userId, title, content } = payload;

  if (!userId || !title?.trim() || !content?.trim()) {
    throw new AppError("User ID, title, and content are required", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const notification = await Notification.create({
    user: userId,
    title: title.trim(),
    content: content.trim(),
  });

  return notification;
};

export const getMyNotifications = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("user", "name email role");

  const unreadCount = await Notification.countDocuments({
    user: userId,
    isRead: false,
  });

  return {
    notifications,
    unreadCount,
  };
};

export const markNotificationAsRead = async (userId, notificationId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.user.toString() !== userId.toString()) {
    throw new AppError("Forbidden", 403);
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

export const markAllNotificationsAsRead = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await Notification.updateMany(
    {
      user: userId,
      isRead: false,
    },
    {
      $set: { isRead: true },
    },
  );

  return {
    message: "All notifications marked as read",
  };
};

export const deleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.user.toString() !== userId.toString()) {
    throw new AppError("Forbidden", 403);
  }

  await notification.deleteOne();

  return {
    message: "Notification deleted successfully",
  };
};
