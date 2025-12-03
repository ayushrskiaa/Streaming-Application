import { Video } from "../models/Video.js";
import fs from "fs";
import { 
  isFFmpegAvailable, 
  generateThumbnailDataUrl, 
  getVideoDuration 
} from "../utils/thumbnailGenerator.js";

class VideoProcessor {
  constructor(io) {
    this.io = io;
    this.processingQueue = new Map();
    this.ffmpegAvailable = false;
    this.checkFFmpeg();
  }

  async checkFFmpeg() {
    this.ffmpegAvailable = await isFFmpegAvailable();
    if (this.ffmpegAvailable) {
      console.log("✓ FFmpeg is available - using real video thumbnails");
    } else {
      console.log("⚠ FFmpeg not found - using placeholder thumbnails");
      console.log("  Install FFmpeg: https://ffmpeg.org/download.html");
    }
  }

  /**
   * Start processing a video
   */
  async processVideo(videoId) {
    try {
      const video = await Video.findById(videoId).populate("uploadedBy", "name email");
      
      if (!video) {
        console.error(`Video not found: ${videoId}`);
        return;
      }

      if (!fs.existsSync(video.filepath)) {
        await Video.findByIdAndUpdate(videoId, {
          status: "failed",
          processingProgress: 0,
        });
        this.emitProgress(video, 0, "failed", "Video file not found");
        return;
      }

      console.log(`Starting processing for video: ${video.title} (${videoId})`);

      await Video.findByIdAndUpdate(videoId, {
        status: "processing",
        processingProgress: 0,
      });
      this.emitProgress(video, 0, "processing", "Starting video analysis...");

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
      await this.sleep(2000);

      await Video.findByIdAndUpdate(video._id, {
        processingProgress: stage.progress,
      });

      this.emitProgress(video, stage.progress, "processing", stage.message);
    }

    const sensitivityResult = this.mockSensitivityAnalysis(video);
    
    // Get real video duration if FFmpeg available
    let duration = this.calculateDuration(video);
    if (this.ffmpegAvailable) {
      const realDuration = await getVideoDuration(video.filepath);
      if (realDuration > 0) duration = realDuration;
    }
    
    // Generate real thumbnail if FFmpeg available, otherwise use placeholder
    let thumbnail = this.generatePlaceholderThumbnail(video);
    if (this.ffmpegAvailable) {
      const realThumbnail = await generateThumbnailDataUrl(video.filepath, video._id.toString());
      if (realThumbnail) thumbnail = realThumbnail;
    }

    await Video.findByIdAndUpdate(video._id, {
      status: "completed",
      sensitivityStatus: sensitivityResult,
      processingProgress: 100,
      duration: duration,
      thumbnail: thumbnail,
    });

    const updatedVideo = await Video.findById(video._id).populate("uploadedBy", "name email");
    this.emitProgress(updatedVideo, 100, "completed", "Video ready for streaming!", sensitivityResult);

    console.log(`Completed processing: ${video.title} - Status: ${sensitivityResult}`);
  }

  /**
   * Mock sensitivity analysis (80% safe, 20% flagged)
   */
  mockSensitivityAnalysis(video) {
    if (video.title.toLowerCase().includes("test")) {
      return "safe";
    }
    return Math.random() > 0.2 ? "safe" : "flagged";
  }

  /**
   * Calculate video duration based on file size
   */
  calculateDuration(video) {
    const sizeMB = video.size / (1024 * 1024);
    const estimatedDuration = Math.floor(sizeMB / 2);
    return Math.max(10, Math.min(estimatedDuration, 3600));
  }

  /**
   * Generate placeholder SVG thumbnail (fallback when FFmpeg not available)
   */
  generatePlaceholderThumbnail(video) {
    const gradients = [
      { start: '#0ea5e9', end: '#3b82f6' }, // Blue
      { start: '#8b5cf6', end: '#a855f7' }, // Purple
      { start: '#ec4899', end: '#f43f5e' }, // Pink
      { start: '#f59e0b', end: '#f97316' }, // Orange
      { start: '#10b981', end: '#14b8a6' }, // Green
    ];
    
    const gradient = gradients[Math.floor(Math.random() * gradients.length)];
    const title = video.title.substring(0, 25);
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:0.7" />
        </linearGradient>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>
      <rect width="320" height="180" fill="url(#bg)"/>
      <circle cx="160" cy="90" r="35" fill="white" opacity="0.2" filter="url(#blur)"/>
      <circle cx="160" cy="90" r="28" fill="white" opacity="0.95"/>
      <path d="M 152 80 L 152 100 L 172 90 Z" fill="${gradient.start}"/>
    </svg>`;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
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
      thumbnail: video.thumbnail || null,
      duration: video.duration || 0,
      timestamp: new Date(),
    };

    this.io.to(`user:${video.uploadedBy._id || video.uploadedBy}`).emit("video:progress", update);
    this.io.to(`tenant:${video.tenantId}`).emit("video:progress", update);

    console.log(`Progress: ${video.title} - ${progress}% - ${message}`);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueStatus() {
    return {
      size: this.processingQueue.size,
      jobs: Array.from(this.processingQueue.keys()),
    };
  }
}

export default VideoProcessor;
