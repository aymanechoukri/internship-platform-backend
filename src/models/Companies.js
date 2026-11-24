import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    website: { type: String, default: "" },
    location: { type: String, default: "" },
    industry: { type: String, default: "" },
    description: { type: String, default: "" },
    verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Company", companySchema);
