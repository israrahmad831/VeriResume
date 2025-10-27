import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalFile: { type: String }, // file path or URL
    parsedData: {
      name: String,
      email: String,
      phone: String,
      education: [String],
      experience: [String],
      skills: [String],
      summary: String,
    },
    aiAnalysis: {
      atsScore: Number,
      keywordDensity: Number,
      grammarScore: Number,
      readability: Number,
      weaknesses: [String],
      suggestions: [String],
    },
    enhancedFile: { type: String }, // path to AI-enhanced resume
    jobTarget: { type: String }, // e.g., "Frontend Developer"
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", ResumeSchema);
export default Resume;
