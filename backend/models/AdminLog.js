import mongoose from "mongoose";

const AdminLogSchema = new mongoose.Schema(
  {
    action: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    details: { type: Object },
    category: {
      type: String,
      enum: ["system", "fraud", "subscription", "user"],
    },
  },
  { timestamps: true }
);

const AdminLog = mongoose.model("AdminLog", AdminLogSchema);
export default AdminLog;
