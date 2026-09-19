import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";

/**
 * @desc    Send a new message in a chat
 * @route   POST /api/messages
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    throw new ApiError(400, "Invalid data passed: content and chatId are required");
  }

  // Create message document
  let message = await Message.create({
    sender: req.user._id,
    content: content.trim(),
    chat: chatId,
  });

  message = await message.populate("sender", "username avatar email");
  message = await message.populate("chat");
  message = await User.populate(message, {
    path: "chat.users",
    select: "username avatar email",
  });

  // Update latestMessage in the Chat document
  await Chat.findByIdAndUpdate(chatId, {
    latestMessage: message,
  });

  // Emit real-time message to chat room via Socket.io
  const io = req.app.get("io");
  if (io) {
    io.to(chatId).emit("receiveMessage", message);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, message, "Message sent successfully"));
});

/**
 * @desc    Fetch all messages for a specific chat
 * @route   GET /api/messages/:chatId
 * @access  Private
 */
export const allMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    throw new ApiError(400, "Chat ID is required");
  }

  const messages = await Message.find({ chat: chatId })
    .populate("sender", "username avatar email")
    .populate("chat")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});
