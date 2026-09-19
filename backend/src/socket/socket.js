import { Server } from "socket.io";

// In-memory map to store online users: { [userId]: socketId }
const userSocketMap = {};

/**
 * Helper to get the active socket ID of a specific user
 * @param {string} receiverId
 * @returns {string|undefined}
 */
export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
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

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`Socket connected: ${socket.id} (User ID: ${userId || "guest"})`);

    if (userId && userId !== "undefined") {
      userSocketMap[userId] = socket.id;
    }

    // Broadcast list of currently online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Join a room (room can be a chatId or group room ID)
    socket.on("joinChat", (room) => {
      socket.join(room);
      console.log(`User ${userId} joined room: ${room}`);
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

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (userId && userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};
