import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      trim: true,
    },

    email: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["student", "admin", "company"],
      default: "student",
    },
  },
  { timestamps: true },
);


export default mongoose.model("User", userSchema);
