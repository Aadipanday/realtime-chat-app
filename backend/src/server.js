import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
app.set("io", io);

// Start server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
  }
};

startServer();

export { server, io };
