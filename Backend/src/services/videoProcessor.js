import { Video } from "../models/Video.js";
import fs from "fs";
import path from "path";

/**
 * Video Processing Service
 * Handles video sensitivity analysis and metadata extraction
 */

class VideoProcessor {
  constructor(io) {
    this.io = io; // Socket.io instance for real-time updates
    this.processingQueue = new Map(); // Track processing jobs
  }

  /**
   * Start processing a video
   * @param {string} videoId - MongoDB video ID
   */
  async processVideo(videoId) {
    try {
      const video = await Video.findById(videoId).populate("uploadedBy", "name email");
      
      if (!video) {
        console.error(`Video not found: ${videoId}`);
        return;
      }

      // Check if video file exists
      if (!fs.existsSync(video.filepath)) {
        await Video.findByIdAndUpdate(videoId, {
          status: "failed",
          processingProgress: 0,
        });
        this.emitProgress(video, 0, "failed", "Video file not found");
        return;
      }

      console.log(`Starting processing for video: ${video.title} (${videoId})`);

      // Update status to processing
      await Video.findByIdAndUpdate(videoId, {
        status: "processing",
        processingProgress: 0,
      });
      this.emitProgress(video, 0, "processing", "Starting video analysis...");

      // Simulate video processing with multiple stages
      await this.analyzeVideo(video);

    } catch (error) {
      console.error(`Error processing video ${videoId}:`, error);
      await Video.findByIdAndUpdate(videoId, {
        status: "failed",
        processingProgress: 0,
      });
      
      const video = await Video.findById(videoId);
      this.emitProgress(video, 0, "failed", error.message);
    }
  }

  /**
   * Analyze video for sensitivity content
   * This is a mock implementation - in production, you'd use:
   * - Azure Video Analyzer
   * - AWS Rekognition
   * - Google Video Intelligence API
   * - Custom ML models
   */
  async analyzeVideo(video) {
    const stages = [
      { progress: 20, message: "Extracting video metadata..." },
      { progress: 40, message: "Analyzing video frames..." },
      { progress: 60, message: "Detecting sensitive content..." },
      { progress: 80, message: "Generating thumbnail..." },
      { progress: 100, message: "Processing complete!" },
    ];

    for (const stage of stages) {
      // Simulate processing time
      await this.sleep(2000);

      // Update progress
      await Video.findByIdAndUpdate(video._id, {
        processingProgress: stage.progress,
      });

      this.emitProgress(video, stage.progress, "processing", stage.message);
    }

    // Mock sensitivity analysis result
    // In production, this would be based on actual video content analysis
    const sensitivityResult = this.mockSensitivityAnalysis(video);

    // Extract mock video duration (in production, use ffprobe or similar)
    const duration = this.mockExtractDuration(video);

    // Update video with final results
    await Video.findByIdAndUpdate(video._id, {
      status: "completed",
      sensitivityStatus: sensitivityResult,
      processingProgress: 100,
      duration: duration,
    });

    const updatedVideo = await Video.findById(video._id).populate("uploadedBy", "name email");
    this.emitProgress(updatedVideo, 100, "completed", "Video ready for streaming!", sensitivityResult);

    console.log(`Completed processing for video: ${video.title} - Status: ${sensitivityResult}`);
  }

  /**
   * Mock sensitivity analysis
   * Returns: "safe" or "flagged"
   */
  mockSensitivityAnalysis(video) {
    // For demo purposes:
    // - 80% chance of "safe"
    // - 20% chance of "flagged"
    // In production, this would analyze actual video content
    
    const random = Math.random();
    
    // You can also add logic based on filename or other factors
    if (video.title.toLowerCase().includes("test")) {
      return "safe";
    }
    
    return random > 0.2 ? "safe" : "flagged";
  }

  /**
   * Mock duration extraction
   * Returns duration in seconds
   */
  mockExtractDuration(video) {
    // In production, use ffprobe to get actual duration
    // For now, estimate based on file size (very rough approximation)
    const sizeMB = video.size / (1024 * 1024);
    const estimatedDuration = Math.floor(sizeMB / 2); // ~2MB per second for typical video
    return Math.max(10, Math.min(estimatedDuration, 3600)); // Between 10 seconds and 1 hour
  }

  /**
   * Emit progress update via Socket.io
   */
  emitProgress(video, progress, status, message, sensitivityStatus = null) {
    if (!this.io) return;

    const update = {
      videoId: video._id.toString(),
      title: video.title,
      progress,
      status,
      message,
      sensitivityStatus: sensitivityStatus || video.sensitivityStatus,
      timestamp: new Date(),
    };

    // Emit to specific user's room
    this.io.to(`user:${video.uploadedBy._id || video.uploadedBy}`).emit("video:progress", update);
    
    // Also emit to tenant room for admins/editors
    this.io.to(`tenant:${video.tenantId}`).emit("video:progress", update);

    console.log(`Progress update for ${video.title}: ${progress}% - ${message}`);
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get processing queue status
   */
  getQueueStatus() {
    return {
      size: this.processingQueue.size,
      jobs: Array.from(this.processingQueue.keys()),
    };
  }
}

export default VideoProcessor;
