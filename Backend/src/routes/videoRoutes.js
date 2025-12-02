import express from "express";
import { upload } from "../config/multer.js";
import { Video } from "../models/Video.js";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /videos/upload - Upload a new video (Editor and Admin only)
router.post("/upload", requireRoles("editor", "admin"), upload.single("video"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    const { title, description } = req.body;

    if (!title) {
      // Clean up uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Title is required" });
    }

    // Create video record in database
    const video = await Video.create({
      title,
      description: description || "",
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      tenantId: req.user.tenantId,
      status: "pending",
      sensitivityStatus: "unknown",
    });

    // Trigger video processing pipeline
    const videoProcessor = req.app.get("videoProcessor");
    if (videoProcessor) {
      // Start processing asynchronously (don't wait for completion)
      videoProcessor.processVideo(video._id.toString()).catch((err) => {
        console.error("Error in video processing:", err);
      });
    }

    res.status(201).json({
      message: "Video uploaded successfully",
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        originalName: video.originalName,
        size: video.size,
        sizeMB: video.sizeMB,
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
        createdAt: video.createdAt,
      },
    });
  } catch (err) {
    // Clean up file if database operation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});

// GET /videos - List all videos for the authenticated user
router.get("/", async (req, res, next) => {
  try {
    const { status, sensitivityStatus, sort = "-createdAt" } = req.query;

    // Build query based on user's tenant
    const query = { tenantId: req.user.tenantId };

    // Apply filters if provided
    if (status) {
      query.status = status;
    }
    if (sensitivityStatus) {
      query.sensitivityStatus = sensitivityStatus;
    }

    // Viewers can only see their own videos
    // Editors and Admins can see all videos in their tenant
    if (req.user.role === "viewer") {
      query.uploadedBy = req.user.userId;
    }

    const videos = await Video.find(query)
      .sort(sort)
      .populate("uploadedBy", "name email")
      .lean();

    res.json({
      count: videos.length,
      videos: videos.map((v) => ({
        id: v._id,
        title: v.title,
        description: v.description,
        originalName: v.originalName,
        size: v.size,
        sizeMB: (v.size / (1024 * 1024)).toFixed(2),
        duration: v.duration,
        status: v.status,
        sensitivityStatus: v.sensitivityStatus,
        processingProgress: v.processingProgress,
        uploadedBy: v.uploadedBy,
        views: v.views,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /videos/:id - Get a single video by ID
router.get("/:id", async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .lean();

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check tenant isolation
    if (video.tenantId !== req.user.tenantId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Viewers can only access their own videos
    if (req.user.role === "viewer" && video.uploadedBy._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        originalName: video.originalName,
        mimeType: video.mimeType,
        size: video.size,
        sizeMB: (video.size / (1024 * 1024)).toFixed(2),
        duration: video.duration,
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
        processingProgress: video.processingProgress,
        uploadedBy: video.uploadedBy,
        views: video.views,
        thumbnail: video.thumbnail,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /videos/:id - Delete a video (Editor and Admin only)
router.delete("/:id", requireRoles("editor", "admin"), async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check tenant isolation
    if (video.tenantId !== req.user.tenantId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Editors can only delete their own videos, admins can delete any
    if (req.user.role === "editor" && video.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied. You can only delete your own videos." });
    }

    // Delete the video file from disk
    if (fs.existsSync(video.filepath)) {
      fs.unlinkSync(video.filepath);
    }

    // Delete the video record from database
    await Video.findByIdAndDelete(req.params.id);

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /videos/:id/reprocess - Retry processing for a failed video (Editor and Admin only)
router.post("/:id/reprocess", requireRoles("editor", "admin"), async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check tenant isolation
    if (video.tenantId !== req.user.tenantId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Editors can only reprocess their own videos, admins can reprocess any
    if (req.user.role === "editor" && video.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied. You can only reprocess your own videos." });
    }

    // Reset video status
    await Video.findByIdAndUpdate(req.params.id, {
      status: "pending",
      processingProgress: 0,
    });

    // Trigger processing
    const videoProcessor = req.app.get("videoProcessor");
    if (videoProcessor) {
      videoProcessor.processVideo(video._id.toString()).catch((err) => {
        console.error("Error in video reprocessing:", err);
      });
    }

    res.json({ message: "Video reprocessing started" });
  } catch (err) {
    next(err);
  }
});

export default router;
