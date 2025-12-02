import mongoose from "mongoose";

const { Schema } = mongoose;

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number, // in bytes
      required: true,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    // Processing status: pending, processing, completed, failed
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    // Sensitivity analysis result: safe, flagged, unknown
    sensitivityStatus: {
      type: String,
      enum: ["unknown", "safe", "flagged"],
      default: "unknown",
    },
    // Processing progress (0-100)
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // User who uploaded the video
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Tenant identifier for multi-tenant isolation
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    // Metadata
    views: {
      type: Number,
      default: 0,
    },
    thumbnail: {
      type: String,
      default: "",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient querying
videoSchema.index({ tenantId: 1, uploadedBy: 1 });
videoSchema.index({ status: 1, sensitivityStatus: 1 });
videoSchema.index({ createdAt: -1 });

// Virtual for file size in MB
videoSchema.virtual("sizeMB").get(function() {
  return (this.size / (1024 * 1024)).toFixed(2);
});

export const Video = mongoose.model("Video", videoSchema);
