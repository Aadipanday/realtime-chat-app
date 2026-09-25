import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";

// In-memory map to store online users: Map<userId, Set<socketId>>
const userSocketMap = new Map();

/**
 * Helper to get the first active socket ID of a specific user
 * @param {string} receiverId
 * @returns {string|undefined}
 */
export const getReceiverSocketId = (receiverId) => {
  if (!receiverId) return undefined;
  const sockets = userSocketMap.get(receiverId.toString());
  if (!sockets || sockets.size === 0) return undefined;
  return Array.from(sockets)[0];
};

/**
 * Helper to get all active socket IDs of a specific user (across tabs/devices)
 * @param {string} receiverId
 * @returns {string[]}
 */
export const getReceiverSocketIds = (receiverId) => {
  if (!receiverId) return [];
  const sockets = userSocketMap.get(receiverId.toString());
  if (!sockets) return [];
  return Array.from(sockets);
};

/**
 * Helper to parse cookies from cookie string
 */
const parseCookies = (cookieString) => {
  if (!cookieString) return {};
  return Object.fromEntries(
    cookieString.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
};

/**
 * Initialize Socket.io server with event handlers
 * @param {import("http").Server} server
 * @returns {Server}
 */
export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // 1. Strict Socket Authentication Middleware:
  // Requires a cryptographically valid JWT signature.
  // Rejects any unauthenticated connection or spoofed user attempt.
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers?.cookie);
      const token =
        socket.handshake.auth?.token ||
        cookies.accessToken ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(
          new Error("Authentication failed: No valid access token provided")
        );
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      } catch (err) {
        return next(
          new Error("Authentication failed: Invalid or expired access token")
        );
      }

      if (!decoded?._id) {
        return next(
          new Error("Authentication failed: Access token missing user ID")
        );
      }

      // Verify that the user exists in database
      const user = await User.findById(decoded._id).select("_id username");
      if (!user) {
        return next(
          new Error("Authentication failed: User account does not exist")
        );
      }

      // Securely bind the socket solely to the verified JWT user ID
      socket.userId = user._id.toString();
      return next();
    } catch (error) {
      return next(new Error("Authentication failed: Internal auth error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`Socket connected: ${socket.id} (User ID: ${userId})`);

    if (userId) {
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId).add(socket.id);

      // Update online status in database
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (e) {
        console.error("Failed to update user online status:", e);
      }

      // Broadcast user is now ONLINE to all clients
      io.emit("userStatusChanged", {
        userId,
        isOnline: true,
        lastSeen: null,
      });
    }

    // Broadcast list of currently online user IDs to all connected clients
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

    // 2. Join a room with strict authorization: only participants can join!
    socket.on("joinChat", async (room) => {
      if (!room) return;
      try {
        const isMember = await Chat.findOne({
          _id: room,
          users: userId,
        });

        if (!isMember) {
          console.warn(
            `Unauthorized joinChat blocked for user ${userId} in room ${room}`
          );
          return;
        }

        socket.join(room);
        console.log(`User ${userId} joined room: ${room}`);
      } catch (err) {
        console.error("Error in joinChat authorization:", err);
      }
    });

    // Leave a room
    socket.on("leaveChat", (room) => {
      socket.leave(room);
      console.log(`User ${userId} left room: ${room}`);
    });

    // Typing indicators
    socket.on("typing", (room) => {
      socket.to(room).emit("typing", room);
    });

    socket.on("stopTyping", (room) => {
      socket.to(room).emit("stopTyping", room);
    });

    // Mark messages as read
    socket.on("markAsRead", async ({ chatId, userId: readerId }) => {
      if (!chatId) return;
      const currentReader = readerId || userId;
      if (!currentReader) return;

      try {
        await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: currentReader },
            readBy: { $ne: currentReader },
          },
          {
            $addToSet: { readBy: currentReader },
          }
        );

        const payload = {
          chatId: chatId.toString(),
          readBy: currentReader.toString(),
        };

        io.to(chatId.toString()).emit("messagesRead", payload);

        // Also emit directly to every participant socket
        const chat = await Chat.findById(chatId);
        if (chat && chat.users) {
          chat.users.forEach((p) => {
            const pid = (p._id || p).toString();
            const sids = getReceiverSocketIds(pid);
            sids.forEach((sid) => {
              io.to(sid).emit("messagesRead", payload);
            });
          });
        }
      } catch (err) {
        console.error("Error in markAsRead socket:", err);
      }
    });

    // Handle disconnect: only mark offline if ALL sockets for this user are closed
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id} (User ID: ${userId})`);
      if (userId && userSocketMap.has(userId)) {
        const userSockets = userSocketMap.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          userSocketMap.delete(userId);

          try {
            const now = new Date();
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: now,
            });
            io.emit("userStatusChanged", {
              userId,
              isOnline: false,
              lastSeen: now,
            });
          } catch (e) {
            console.error("Failed to update user offline status:", e);
          }
        }
      }
      io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
    });
  });

  return io;
};
