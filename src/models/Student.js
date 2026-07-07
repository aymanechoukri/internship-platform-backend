import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    university: {
      type: String,
      required: true,
      trim: true,
    },

    major: {
      type: String,
      required: true,
      trim: true,
    },

    faculty: {
      type: string,
      required: true,
      trim: true,
    },

    graduationYear: {
      type: Number,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Student", studentSchema);
