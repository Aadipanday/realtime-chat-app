import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/error.middleware.js";

// Routes imports
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";

const app = express();

// Trust reverse proxy (Render, Vercel, Cloudflare) for accurate client IP detection
app.set("trust proxy", 1);

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2. CORS configuration (supports production Vercel domains, CLIENT_URL, and local dev)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const clientUrl = process.env.CLIENT_URL || "";
      if (
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        (clientUrl && origin.includes(clientUrl.replace(/\/+$/, "")))
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// 3. Body parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// 4. Rate Limiting to prevent brute-force & spam DoS attacks
// Strict limiter for authentication (stops brute-force credential guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Max 20 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many login/registration attempts from this IP. Please try again after 15 minutes.",
    });
  },
});

// Limiter for media & file uploads to prevent storage abuse
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Max 50 file uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Upload rate limit reached. Please wait a few minutes before uploading more media.",
    });
  },
});

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many requests from this IP. Please slow down.",
    });
  },
});

app.use("/api", generalLimiter);
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/change-password", authLimiter);
app.use("/api/users/avatar", uploadLimiter);
app.use("/api/messages", uploadLimiter);

// Root & health check routes
app.get("/", (req, res) => {
  res.status(200).json({
    status: "active",
    app: "PulseChat",
    message: "PulseChat Backend is running securely 🚀 • Powered by aadi",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running smoothly and securely",
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// Centralized error handler (must be after routes)
app.use(errorHandler);

export default app;
