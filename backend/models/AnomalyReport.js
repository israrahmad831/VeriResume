import mongoose from "mongoose";

const AnomalyReportSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Anomaly analysis results
    riskScore: { type: Number, default: 0, min: 0, max: 100 }, // 0-100
    riskLevel: { 
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low'
    },
    
    // Anomaly indicators
    indicators: [String], // List of anomaly red flags
    
    // Duplicate detection
    duplicates: [
      {
        resumeId: String,
        similarity: Number,
        matchedFields: [String]
      }
    ],
    
    // Recommendations
    recommendations: [String],
    
    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'cleared', 'flagged'],
      default: 'pending'
    },
    isFlagged: { type: Boolean, default: false },
    
    // Priority level
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    
    // Admin notes
    reviewNotes: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

// Index for faster queries
AnomalyReportSchema.index({ status: 1, priority: -1 });
AnomalyReportSchema.index({ resume: 1 });

const AnomalyReport = mongoose.model("AnomalyReport", AnomalyReportSchema);
export default AnomalyReport;
