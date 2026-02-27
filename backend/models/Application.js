import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobSeeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  hr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'],
    default: 'pending'
  },
  matchScore: {
    type: Number,
    default: 0
  },
  coverNote: {
    type: String,
    default: ''
  },
  hrNotes: {
    type: String,
    default: ''
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    note: String
  }],
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ jobSeeker: 1, job: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
