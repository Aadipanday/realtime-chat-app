import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// Standard secure cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

// Helper function to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "All fields (username, email, password) are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Handle avatar upload if provided
  let avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  const avatarLocalPath = req.file?.path;

  if (avatarLocalPath) {
    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
    if (uploadedAvatar?.secure_url || uploadedAvatar?.url) {
      avatarUrl = uploadedAvatar.secure_url || uploadedAvatar.url;
    }
  }

  // Create user
  const user = await User.create({
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    password,
    avatar: avatarUrl,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed, please try again");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { user: createdUser, accessToken, refreshToken },
        "User registered successfully"
      )
    );
});

/**
 * @desc    Log in user
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!password || (!email && !username)) {
    throw new ApiError(400, "Username or Email, and Password are required");
  }

  // Find user by email or username
  const searchConditions = [];
  if (email) searchConditions.push({ email: email.toLowerCase().trim() });
  if (username) searchConditions.push({ username: username.toLowerCase().trim() });

  const user = await User.findOne({
    $or: searchConditions,
  });

  if (!user) {
    throw new ApiError(404, "User does not exist with the given credentials");
  }

  // Verify password
  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

/**
 * @desc    Log out user
 * @route   POST /api/users/logout
 * @access  Private (Protected by verifyJWT)
 */
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * @desc    Refresh Access Token using Refresh Token
 * @route   POST /api/users/refresh-token
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized: Refresh token missing");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token: User not found");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or already used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/users/current-user
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  const userObj = req.user.toObject ? req.user.toObject() : req.user;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...userObj, accessToken: token },
        "Current user fetched successfully"
      )
    );
});

/**
 * @desc    Get / Search all users for chat list/sidebar (excluding logged in user)
 * @route   GET /api/users
 * @access  Private
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim();
  let keyword = {};

  if (search) {
    // Sanitize special regex characters to prevent ReDoS
    const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    keyword = {
      $or: [
        { username: { $regex: sanitizedSearch, $options: "i" } },
        { email: { $regex: sanitizedSearch, $options: "i" } },
      ],
    };
  }

  const currentUserId = req.user._id;

  // Retrieve user's active 1-to-1 chats to identify existing contacts
  const existingUserChats = await Chat.find({
    users: currentUserId,
    isGroupChat: false,
  }).select("users");

  const contactUserIds = new Set();
  existingUserChats.forEach((chat) => {
    chat.users.forEach((uid) => {
      if (uid.toString() !== currentUserId.toString()) {
        contactUserIds.add(uid.toString());
      }
    });
  });

  const users = await User.find({
    ...keyword,
    _id: { $ne: currentUserId },
  })
    .select("-password -refreshToken")
    .lean();

  const filteredUsers = users
    .filter((user) => {
      const isContact = contactUserIds.has(user._id.toString());
      const findSetting = user.privacySettings?.whoCanFindMe || "everyone";
      // If user sets whoCanFindMe to "nobody", they do not appear in searches unless they already share a chat
      if (findSetting === "nobody" && !isContact) {
        return false;
      }
      return true;
    })
    .map((user) => {
      const isContact = contactUserIds.has(user._id.toString());
      const photoPrivacy = user.privacySettings?.profilePhoto || "everyone";
      if (
        photoPrivacy === "nobody" ||
        (photoPrivacy === "contacts" && !isContact)
      ) {
        return {
          ...user,
          avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=private",
          isAvatarHidden: true,
        };
      }
      return user;
    });

  return res
    .status(200)
    .json(new ApiResponse(200, filteredUsers, "Users fetched successfully"));
});

/**
 * @desc    Update user avatar
 * @route   PATCH /api/users/avatar
 * @access  Private
 */
export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image file is required");
  }

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
  if (!uploadedAvatar?.secure_url && !uploadedAvatar?.url) {
    throw new ApiError(500, "Error while uploading avatar to cloud");
  }

  const avatarUrl = uploadedAvatar.secure_url || uploadedAvatar.url;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatarUrl,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

/**
 * @desc    Change current user password
 * @route   POST /api/users/change-password
 * @access  Private
 */
export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password cannot be the same as old password");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.matchPassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Incorrect current password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * @desc    Get a user's public profile with privacy applied
 * @route   GET /api/users/profile/:userId
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const targetUser = await User.findById(userId)
    .select("-password -refreshToken")
    .lean();

  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  const currentUserId = req.user._id;
  const isSelf = targetUser._id.toString() === currentUserId.toString();

  if (isSelf) {
    return res
      .status(200)
      .json(new ApiResponse(200, targetUser, "Profile retrieved successfully"));
  }

  // Check if they share any chat (1-to-1 or group)
  const sharedChat = await Chat.findOne({
    users: { $all: [currentUserId, targetUser._id] },
  });

  const isContact = !!sharedChat;
  const photoPrivacy = targetUser.privacySettings?.profilePhoto || "everyone";

  const sanitizedUser = {
    _id: targetUser._id,
    username: targetUser.username,
    email: targetUser.email,
    about: targetUser.about || "Hey there! I am using PulseChat.",
    avatar: targetUser.avatar,
    isOnline: targetUser.isOnline,
    lastSeen: targetUser.lastSeen,
    createdAt: targetUser.createdAt,
    isAvatarHidden: false,
  };

  if (
    photoPrivacy === "nobody" ||
    (photoPrivacy === "contacts" && !isContact)
  ) {
    sanitizedUser.avatar = "https://api.dicebear.com/7.x/identicon/svg?seed=private";
    sanitizedUser.isAvatarHidden = true;
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, sanitizedUser, "User profile retrieved successfully")
    );
});

/**
 * @desc    Update privacy settings for current user
 * @route   PATCH /api/users/privacy
 * @access  Private
 */
export const updatePrivacySettings = asyncHandler(async (req, res) => {
  const { profilePhoto, whoCanFindMe } = req.body;

  const validPhotoOptions = ["everyone", "contacts", "nobody"];
  const validFindOptions = ["everyone", "nobody"];

  const updateFields = {};

  if (profilePhoto !== undefined) {
    if (!validPhotoOptions.includes(profilePhoto)) {
      throw new ApiError(400, "Invalid profile photo privacy option");
    }
    updateFields["privacySettings.profilePhoto"] = profilePhoto;
  }

  if (whoCanFindMe !== undefined) {
    if (!validFindOptions.includes(whoCanFindMe)) {
      throw new ApiError(400, "Invalid search privacy option");
    }
    updateFields["privacySettings.whoCanFindMe"] = whoCanFindMe;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No privacy settings provided to update");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Privacy settings updated successfully")
    );
});

/**
 * @desc    Update profile info (About status)
 * @route   PATCH /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { about } = req.body;

  if (about !== undefined && about.length > 140) {
    throw new ApiError(400, "About status cannot exceed 140 characters");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        about: about ? about.trim() : "Hey there! I am using PulseChat.",
      },
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});
