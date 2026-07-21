import asyncHandler from "../../../utils/asyncHandler.js";
import * as messageService from "./message.service.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await messageService.sendMessage(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: message,
  });
});

export const getConversation = asyncHandler(async (req, res) => {
  const messages = await messageService.getConversation(
    req.user._id,
    req.params.userId,
  );

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

export const getRecentConversations = asyncHandler(async (req, res) => {
  const conversations = await messageService.getRecentConversations(req.user._id);

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations,
  });
});
