import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true, trim: true },
  targetType: { type: String, required: true, trim: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  details: { type: String, default: "" },
}, { timestamps: true });

adminLogSchema.index({ createdAt: -1 });
export default mongoose.model("AdminLog", adminLogSchema);
