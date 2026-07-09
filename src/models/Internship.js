import mongoose from "mongoose";

const internshipSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["Remote", "Onsite", "Hybrid"],
      default: "Onsite",
    },

    duration: {
      type: String,
      default: "",
    },

    salary: {
      type: Number,
      default: 0,
    },

    skills: [
      {
        type: String,
      },
    ],

    deadline: {
      type: date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Internship", internshipSchema);
