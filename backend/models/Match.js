import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    matchScore: { type: Number }, // e.g., 85%
    missingKeywords: [String],
    matchedSkills: [String],
  },
  { timestamps: true }
);

const Match = mongoose.model("Match", MatchSchema);
export default Match;
