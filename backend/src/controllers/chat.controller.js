import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";

/**
 * @desc    Create or access a 1-to-1 chat
 * @route   POST /api/chats
 * @access  Private
 */
export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(400, "UserId param not sent with request");
  }

  if (userId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Cannot create a 1-to-1 chat with yourself");
  }

  // Check if a 1-to-1 chat already exists between the two users
  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password -refreshToken")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "username avatar email",
  });

  if (isChat.length > 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, isChat[0], "Chat fetched successfully"));
  } else {
    // Create a new 1-to-1 chat
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password -refreshToken"
    );

    return res
      .status(201)
      .json(new ApiResponse(201, fullChat, "New 1-to-1 chat created successfully"));
  }
});

/**
 * @desc    Fetch all chats for the logged in user
 * @route   GET /api/chats
 * @access  Private
 */
export const fetchChats = asyncHandler(async (req, res) => {
  let chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  chats = await User.populate(chats, {
    path: "latestMessage.sender",
    select: "username avatar email",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats retrieved successfully"));
});

/**
 * @desc    Create a new Group Chat room
 * @route   POST /api/chats/group
 * @access  Private
 */
export const createGroupChat = asyncHandler(async (req, res) => {
  const { users, name } = req.body;

  if (!users || !name) {
    throw new ApiError(400, "Group name and members are required");
  }

  // users can be passed as JSON string from multipart or array
  let groupMembers = typeof users === "string" ? JSON.parse(users) : users;

  if (groupMembers.length < 2) {
    throw new ApiError(
      400,
      "At least 2 other users are required to form a group chat"
    );
  }

  // Add the current logged-in user to the group members if not already included
  if (!groupMembers.some((id) => id.toString() === req.user._id.toString())) {
    groupMembers.push(req.user._id);
  }

  const groupChat = await Chat.create({
    chatName: name.trim(),
    users: groupMembers,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken");

  return res
    .status(201)
    .json(
      new ApiResponse(201, fullGroupChat, "Group chat created successfully")
    );
});

/**
 * @desc    Rename a group chat
 * @route   PATCH /api/chats/group/rename
 * @access  Private
 */
export const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!chatId || !chatName) {
    throw new ApiError(400, "Chat ID and new chat name are required");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName: chatName.trim() },
    { new: true }
  )
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken");

  if (!updatedChat) {
    throw new ApiError(404, "Chat not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedChat, "Group chat renamed successfully"));
});

/**
 * @desc    Add a user to group chat
 * @route   PATCH /api/chats/group/add
 * @access  Private (Admin only)
 */
export const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    throw new ApiError(400, "Chat ID and User ID are required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  // Verify group admin
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only group admin can add members to the group");
  }

  // Check if user is already in the group (compare ObjectIds as strings)
  if (chat.users.some((id) => id.toString() === userId.toString())) {
    throw new ApiError(400, "User is already in the group");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedChat, "User added to group successfully"));
});

/**
 * @desc    Remove a user from group chat or leave group
 * @route   PATCH /api/chats/group/remove
 * @access  Private
 */
export const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    throw new ApiError(400, "Chat ID and User ID are required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  // Only admin can remove members, or a user can remove themselves (leave group)
  const isAdmin = chat.groupAdmin.toString() === req.user._id.toString();
  const isSelf = req.user._id.toString() === userId.toString();

  if (!isAdmin && !isSelf) {
    throw new ApiError(
      403,
      "Only the group admin can remove other members from the group"
    );
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedChat, "User removed from group successfully")
    );
});
