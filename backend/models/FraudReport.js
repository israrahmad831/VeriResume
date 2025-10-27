import mongoose from "mongoose";

const FraudReportSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    hr: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authenticityScore: { type: Number }, // e.g., 78 means 78% authentic
    issues: [String], // e.g., ["Copied content", "Skill mismatch"]
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const FraudReport = mongoose.model("FraudReport", FraudReportSchema);
export default FraudReport;
