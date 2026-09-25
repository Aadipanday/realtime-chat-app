import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { getReceiverSocketId, getReceiverSocketIds } from "../socket/socket.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * @desc    Send a new message in a chat (text, image, or audio)
 * @route   POST /api/messages
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  const fileLocalPath = req.file?.path;

  if (!chatId) {
    throw new ApiError(400, "Chat ID is required");
  }

  if (!content?.trim() && !fileLocalPath) {
    throw new ApiError(400, "Message content or file attachment is required");
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

  let mediaUrl = null;
  let mediaType = "text";

  if (fileLocalPath) {
    const uploaded = await uploadOnCloudinary(fileLocalPath);
    if (uploaded?.url) {
      mediaUrl = uploaded.url;
      mediaType = req.file.mimetype.startsWith("audio") ? "audio" : "image";
    }
  }

  // Create message document
  let message = await Message.create({
    sender: req.user._id,
    content: (content || "").trim(),
    chat: chatId,
    mediaUrl,
    mediaType,
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

        const recipientSocketIds = getReceiverSocketIds(participantId);
        recipientSocketIds.forEach((sid) => {
          io.to(sid).emit("messageNotification", message);
        });
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

  // Mark messages from other users as read by current user
  await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    },
    {
      $addToSet: { readBy: req.user._id },
    }
  );

  const io = req.app.get("io");
  if (io) {
    const payload = {
      chatId: chatId.toString(),
      readBy: req.user._id.toString(),
    };
    io.to(chatId.toString()).emit("messagesRead", payload);

    if (chat.users) {
      chat.users.forEach((p) => {
        const pid = (p._id || p).toString();
        const sids = getReceiverSocketIds(pid);
        sids.forEach((sid) => {
          io.to(sid).emit("messagesRead", payload);
        });
      });
    }
  }

  const messages = await Message.find({ chat: chatId })
    .populate("sender", "username avatar email")
    .populate("reactions.user", "username avatar")
    .populate("chat")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

/**
 * @desc    Mark all messages in a chat as read
 * @route   PATCH /api/messages/read/:chatId
 * @access  Private
 */
export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    throw new ApiError(400, "Chat ID is required");
  }

  await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    },
    {
      $addToSet: { readBy: req.user._id },
    }
  );

  const chat = await Chat.findById(chatId);
  const io = req.app.get("io");
  if (io) {
    const payload = {
      chatId: chatId.toString(),
      readBy: req.user._id.toString(),
    };
    io.to(chatId.toString()).emit("messagesRead", payload);

    if (chat && chat.users) {
      chat.users.forEach((p) => {
        const pid = (p._id || p).toString();
        const sid = getReceiverSocketId(pid);
        if (sid) {
          io.to(sid).emit("messagesRead", payload);
        }
      });
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { chatId, readBy: req.user._id },
        "Messages marked as read"
      )
    );
});

/**
 * @desc    React to a message with emoji (thumbs up, heart, laugh, etc.)
 * @route   PATCH /api/messages/:messageId/react
 * @access  Private
 */
export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) {
    throw new ApiError(400, "Emoji is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Check if user already reacted with this emoji (toggle)
  const existingIndex = message.reactions.findIndex(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (existingIndex > -1) {
    if (message.reactions[existingIndex].emoji === emoji) {
      // Toggle off
      message.reactions.splice(existingIndex, 1);
    } else {
      // Change emoji
      message.reactions[existingIndex].emoji = emoji;
    }
  } else {
    // Add new reaction
    message.reactions.push({
      user: req.user._id,
      emoji,
    });
  }

  await message.save();

  const populated = await Message.findById(messageId)
    .populate("sender", "username avatar email")
    .populate("reactions.user", "username avatar");

  const io = req.app.get("io");
  if (io) {
    const payload = {
      messageId: messageId.toString(),
      chatId: message.chat.toString(),
      reactions: populated.reactions,
    };
    io.to(message.chat.toString()).emit("messageReactionUpdated", payload);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, populated.reactions, "Reaction updated"));
});

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Only the sender can delete their message
  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  const chatId = message.chat;
  await Message.findByIdAndDelete(messageId);

  // Update latestMessage in Chat if this deleted message was the latest one
  const chat = await Chat.findById(chatId);
  if (chat && chat.latestMessage?.toString() === messageId.toString()) {
    const previousMessage = await Message.findOne({ chat: chatId }).sort({
      createdAt: -1,
    });
    chat.latestMessage = previousMessage ? previousMessage._id : null;
    await chat.save();
  }

  // Real-time broadcast deletion to the room
  const io = req.app.get("io");
  if (io) {
    io.to(chatId.toString()).emit("messageDeleted", {
      messageId,
      chatId: chatId.toString(),
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { messageId, chatId }, "Message deleted successfully"));
});
