import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor", "admin"],
      default: "viewer",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);


