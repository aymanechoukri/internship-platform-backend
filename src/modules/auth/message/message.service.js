import AppError from "../../../utils/AppError.js";
import Message from "../../../models/Message.js";
import User from "../../../models/User.js";

export const sendMessage = async (senderId, payload) => {
  const { recipientId, content } = payload;

  if (!recipientId || !content?.trim()) {
    throw new AppError("Recipient ID and message content are required", 400);
  }

  if (senderId.toString() === recipientId) {
    throw new AppError("You cannot send a message to yourself", 400);
  }

  const sender = await User.findById(senderId);
  const recipient = await User.findById(recipientId);

  if (!sender || !recipient) {
    throw new AppError("Sender or recipient not found", 404);
  }

  const message = await Message.create({
    sender: senderId,
    recipient: recipientId,
    content: content.trim(),
  });

  return message;
};

export const getConversation = async (userId, otherUserId) => {
  if (!otherUserId) {
    throw new AppError("Other user ID is required", 400);
  }

  const user = await User.findById(userId);
  const otherUser = await User.findById(otherUserId);

  if (!user || !otherUser) {
    throw new AppError("User not found", 404);
  }

  const messages = await Message.find({
    $or: [
      { sender: userId, recipient: otherUserId },
      { sender: otherUserId, recipient: userId },
    ],
  })
    .populate("sender", "name email role")
    .populate("recipient", "name email role")
    .sort({ createdAt: 1 });

  await Message.updateMany(
    {
      recipient: userId,
      sender: otherUserId,
      readAt: null,
    },
    { $set: { readAt: new Date() } },
  );

  return messages;
};

export const getRecentConversations = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { recipient: userId }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ["$sender", userId] }, "$recipient", "$sender"],
        },
        lastMessage: { $first: "$content" },
        lastMessageAt: { $first: "$createdAt" },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$recipient", userId] }, { $eq: ["$readAt", null] }] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "participant",
      },
    },
    {
      $unwind: "$participant",
    },
    {
      $project: {
        _id: 1,
        participant: {
          _id: "$participant._id",
          name: "$participant.name",
          email: "$participant.email",
          role: "$participant.role",
        },
        lastMessage: 1,
        lastMessageAt: 1,
        unreadCount: 1,
      },
    },
    {
      $sort: { lastMessageAt: -1 },
    },
  ]);

  return conversations;
};
