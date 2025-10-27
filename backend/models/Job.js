import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    hr: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String },
    salaryRange: { type: String },
    jobType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Remote", "Internship"],
    },
    skillsRequired: [String],
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resume" }],
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", JobSchema);
export default Job;
