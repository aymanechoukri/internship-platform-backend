import mongoose from "mongoose";

const cvSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    // Retained for older records created by the disk-storage implementation.
    filePath: {
      type: String,
      default: null,
      trim: true,
    },
    // PDF files are limited to 5 MB, safely below MongoDB's 16 MB document cap.
    // Exclude the binary from normal list/detail API responses.
    fileData: {
      type: Buffer,
      required: false,
      select: false,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

cvSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("CV", cvSchema);
