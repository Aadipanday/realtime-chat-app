import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { getReceiverSocketId } from "../socket/socket.js";

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

  // Verify chat exists and user is a participant
  const targetChat = await Chat.findById(chatId);
  if (!targetChat) {
    throw new ApiError(404, "Chat not found");
  }

  const isMember = targetChat.users.some(
    (userId) => userId.toString() === req.user._id.toString()
  );
  if (!isMember) {
    throw new ApiError(403, "You are not authorized to send messages in this chat");
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

  // Real-time distribution via Socket.io
  const io = req.app.get("io");
  if (io) {
    // 1. Broadcast to active chat room
    io.to(chatId).emit("receiveMessage", message);

    // 2. Also notify each participant's personal socket for unread count & notification sound
    if (message.chat?.users) {
      message.chat.users.forEach((participant) => {
        const participantId = participant._id
          ? participant._id.toString()
          : participant.toString();

        // Do not notify sender themselves
        if (participantId === req.user._id.toString()) return;

        const recipientSocketId = getReceiverSocketId(participantId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("messageNotification", message);
        }
      });
    }
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

  // Verify chat exists and user is a participant
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  const isMember = chat.users.some(
    (userId) => userId.toString() === req.user._id.toString()
  );
  if (!isMember) {
    throw new ApiError(403, "You are not authorized to view messages in this chat");
  }

  const messages = await Message.find({ chat: chatId })
    .populate("sender", "username avatar email")
    .populate("chat")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});
