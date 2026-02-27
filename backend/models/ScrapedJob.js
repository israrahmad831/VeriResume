import mongoose from "mongoose";

/**
 * ScrapedJob - Stores jobs scraped from external platforms (Indeed, Rozee, etc.)
 * These are separate from HR-posted jobs in the Job collection.
 */
const ScrapedJobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, default: "Unknown Company" },
    location: { type: String, default: "Pakistan" },
    description: { type: String, default: "" },
    source: {
      type: String,
      enum: ["indeed", "rozee", "glassdoor", "mustakbil", "linkedin", "other"],
      required: true,
    },
    url: { type: String, required: true },
    postedDate: { type: String, default: "Recently" },
    salary: { type: String },
    easyApply: { type: Boolean, default: false },

    // Matching metadata
    extractedSkills: [String],
    requiredExperience: { type: Number },

    // Track which resumes matched to this job
    matches: [
      {
        resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        matchScore: Number,
        matchedSkills: [String],
        missingSkills: [String],
        matchedAt: { type: Date, default: Date.now },
      },
    ],

    // Cache management
    scrapedAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
    },
  },
  { timestamps: true }
);

// Index for deduplication and fast lookups
ScrapedJobSchema.index({ url: 1 }, { unique: true });
ScrapedJobSchema.index({ source: 1, scrapedAt: -1 });
ScrapedJobSchema.index({ "matches.userId": 1 });
ScrapedJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete after TTL

const ScrapedJob = mongoose.model("ScrapedJob", ScrapedJobSchema);
export default ScrapedJob;
