import dotenv from "dotenv";

// Load environment variables before importing modules that depend on them
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import VideoProcessor from "./services/videoProcessor.js";


const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const DEPLOYMENT_ORIGIN = process.env.DEPLOYMENT_ORIGIN;
const JWT_SECRET = process.env.JWT_SECRET;

if (!PORT || !MONGO_URI || !CLIENT_ORIGIN || !JWT_SECRET) {
  // Fail fast if required environment variables are missing
  // This avoids accidentally relying on hardcoded defaults.
  console.error(
    "Missing required environment variables. Please set PORT, MONGO_URI, CLIENT_ORIGIN, and JWT_SECRET in your backend .env file."
  );
  process.exit(1);
}

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Socket.io setup
const allowedOrigins = [CLIENT_ORIGIN];
if (DEPLOYMENT_ORIGIN) allowedOrigins.push(DEPLOYMENT_ORIGIN);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Initialize video processor with Socket.io
const videoProcessor = new VideoProcessor(io);

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join user-specific room for real-time updates
  socket.on("join", ({ userId, tenantId, role }) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} (${role}) joined their room`);
    }
    if (tenantId) {
      socket.join(`tenant:${tenantId}`);
      console.log(`User joined tenant room: ${tenantId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Make io and videoProcessor available to routes
app.set("io", io);
app.set("videoProcessor", videoProcessor);

// Global middlewares
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use("/videos", videoRoutes);
app.use("/stream", streamRoutes);

// Health check / base route
app.get("/", (_req, res) => {
  res.json({ message: "Backend API is running" });
});

// TODO: mount routes here (auth, videos, stream, admin)

// Centralized error handler placeholder
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });


