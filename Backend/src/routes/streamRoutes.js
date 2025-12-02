import express from "express";
import fs from "fs";
import path from "path";
import { Video } from "../models/Video.js";
import { streamAuthMiddleware } from "../middleware/streamAuth.js";

const router = express.Router();

// All routes require authentication (supports query token for video streaming)
router.use(streamAuthMiddleware);

/**
 * GET /stream/:id - Stream video with HTTP range request support
 * Enables video seeking and progressive loading
 */
router.get("/:id", async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // Fetch video metadata from database
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check tenant isolation
    if (video.tenantId !== req.user.tenantId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Viewers can only access their own videos
    if (req.user.role === "viewer" && video.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only stream completed videos
    if (video.status !== "completed") {
      return res.status(400).json({ 
        message: "Video is not ready for streaming",
        status: video.status,
        progress: video.processingProgress
      });
    }

    // Check if video file exists
    if (!fs.existsSync(video.filepath)) {
      return res.status(404).json({ message: "Video file not found on server" });
    }

    // Get file stats
    const stat = fs.statSync(video.filepath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Increment view count
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    if (range) {
      // Parse Range header (e.g., "bytes=0-1023")
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Validate range
      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({
          "Content-Range": `bytes */${fileSize}`
        });
        return res.end();
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(video.filepath, { start, end });

      // Set response headers for partial content
      res.status(206).set({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": video.mimeType,
        "Cache-Control": "public, max-age=3600",
      });

      // Pipe the file stream to response
      fileStream.pipe(res);

      fileStream.on("error", (error) => {
        console.error("Stream error:", error);
        res.end();
      });

    } else {
      // No range requested, send entire file
      res.status(200).set({
        "Content-Length": fileSize,
        "Content-Type": video.mimeType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      });

      const fileStream = fs.createReadStream(video.filepath);
      fileStream.pipe(res);

      fileStream.on("error", (error) => {
        console.error("Stream error:", error);
        res.end();
      });
    }

  } catch (err) {
    next(err);
  }
});

/**
 * GET /stream/:id/info - Get video streaming info without actually streaming
 * Useful for checking if video is ready and getting metadata
 */
router.get("/:id/info", async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId).populate("uploadedBy", "name email");

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

    const fileExists = fs.existsSync(video.filepath);
    const fileSize = fileExists ? fs.statSync(video.filepath).size : 0;

    res.json({
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        originalName: video.originalName,
        mimeType: video.mimeType,
        size: video.size,
        sizeMB: video.sizeMB,
        duration: video.duration,
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
        processingProgress: video.processingProgress,
        uploadedBy: video.uploadedBy,
        views: video.views,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      },
      streaming: {
        available: video.status === "completed" && fileExists,
        fileSize: fileSize,
        streamUrl: `/stream/${video._id}`,
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
