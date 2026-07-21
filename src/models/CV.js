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

    filePath: {
      type: String,
      required: true,
      trim: true,
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
