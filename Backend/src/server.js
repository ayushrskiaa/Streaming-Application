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
  console.error(
    "Missing required environment variables. Please set PORT, MONGO_URI, CLIENT_ORIGIN, and JWT_SECRET in your backend .env file."
  );
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

const allowedOrigins = [CLIENT_ORIGIN];
if (DEPLOYMENT_ORIGIN) allowedOrigins.push(DEPLOYMENT_ORIGIN);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const videoProcessor = new VideoProcessor(io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

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

app.set("io", io);
app.set("videoProcessor", videoProcessor);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/auth", authRoutes);
app.use("/videos", videoRoutes);
app.use("/stream", streamRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Backend API is running" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

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


