import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import axios from 'axios';
import { ObjectId } from 'mongodb';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import AnomalyReport from '../models/AnomalyReport.js';
import Application from '../models/Application.js';
import Subscription from '../models/Subscription.js';
import AdminLog from '../models/AdminLog.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import { matchScrapedJobs, extractSkillsFromResume } from '../utils/recommendationEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Python AI Service URL
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});

// ============================================
// EXISTING ROUTES
// ============================================

router.get('/me', authMiddleware, (req, res) => {
  const user = req.user;
  // exclude sensitive fields
  res.json({ id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role });
});

// ============================================
// JOB SEEKER ROUTES
// ============================================

/**
 * POST /api/jobseeker/upload-resume
 * Upload resume, parse it, and save to database
 */
router.post('/jobseeker/upload-resume', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('[UPLOAD] No file in request');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const userId = req.user._id;
    const filePath = req.file.path;
    const targetRole = req.body.targetRole || '';

    console.log(`[UPLOAD] Starting resume upload for user: ${userId}`);
    console.log(`[UPLOAD] File path: ${filePath}`);
    console.log(`[UPLOAD] File name: ${req.file.originalname}`);
    console.log(`[UPLOAD] Target role: ${targetRole || 'Not specified'}`);

    // Call Python service to parse resume
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream, req.file.originalname);

    console.log(`[UPLOAD] Sending to Python service: ${PYTHON_SERVICE_URL}/api/parse-resume`);

    let parsedData = { name: '', email: '', phone: '', education: [], experience: [], skills: [], summary: '', raw_text: '' };
    let pythonServiceAvailable = true;
    
    try {
      const parseResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/parse-resume`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 60000,
      });
      console.log(`[UPLOAD] Python service response status: ${parseResponse.status}`);
      if (!parseResponse.data.success) {
        console.warn(`[UPLOAD] Python service error: ${parseResponse.data.error} — saving basic record`);
        pythonServiceAvailable = false;
      } else {
        parsedData = parseResponse.data.data;
      }
    } catch (pythonErr) {
      console.warn(`[UPLOAD] Python service unavailable (${pythonErr.code}) — saving basic record with filename`);
      pythonServiceAvailable = false;
      // Extract name from filename as fallback
      const nameFallback = req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      parsedData.name = nameFallback;
    }

    // Convert education, experience arrays to simple strings
    // parsedData.education is an array of objects like [{degree: '...', institution: '...', year: '...'}]
    // We need to convert each object to a readable string
    const educationStrings = Array.isArray(parsedData.education) 
      ? parsedData.education.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            // Convert object to readable string: "Bachelor's in CS - MIT (2020)"
            const degree = item.degree || 'Degree';
            const institution = item.institution || '';
            const year = item.year || '';
            return `${degree}${institution ? ' - ' + institution : ''}${year ? ' (' + year + ')' : ''}`;
          }
          return String(item);
        })
      : [];
    
    const experienceStrings = Array.isArray(parsedData.experience)
      ? parsedData.experience.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            // Convert object to readable string: "Software Engineer at Google (2020-2023)"
            const title = item.title || item.position || 'Position';
            const company = item.company || '';
            const duration = item.duration || item.dates || '';
            return `${title}${company ? ' at ' + company : ''}${duration ? ' (' + duration + ')' : ''}`;
          }
          return String(item);
        })
      : [];
    
    const skillsStrings = Array.isArray(parsedData.skills)
      ? parsedData.skills.map(item => typeof item === 'string' ? item : String(item))
      : [];

    // Save resume to database
    const resume = new Resume({
      user: userId,
      originalFile: req.file.filename,
      parsedData: {
        name: parsedData.name || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        education: educationStrings,
        experience: experienceStrings,
        skills: skillsStrings,
        summary: parsedData.summary || '',
      },
      jobTarget: targetRole,
      aiAnalysis: {
        atsScore: 0,
        keywordDensity: 0,
        grammarScore: 0,
        readability: 0,
        structureScore: 0,
        weaknesses: [],
        suggestions: [],
      },
    });

    await resume.save();

    // Automatically analyze the resume after upload
    try {
      const resumeText = parsedData.raw_text || parsedData.rawText || '';
      
      if (resumeText && resumeText.length > 50) {  // Only analyze if we have substantial text
        console.log('Starting automatic AI analysis for resume:', resume._id);
        
        // Create a job description from the target role
        const jobDescription = targetRole 
          ? `Looking for a ${targetRole} with strong technical skills and relevant experience.`
          : 'Looking for a talented professional with relevant skills and experience.';
        
        const analyzeResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/analyze-resume`, {
          resumeText: resumeText,
          jobDescription: jobDescription,
          targetRole: targetRole,
        }, {
          timeout: 60000, // 60 second timeout
        });

        if (analyzeResponse.data.success) {
          const analysis = analyzeResponse.data.data;
          
          // Update resume with AI analysis
          resume.aiAnalysis = {
            atsScore: analysis.ats_score || analysis.atsScore || 0,
            keywordDensity: analysis.keyword_density || analysis.keywordDensity || 0,
            grammarScore: analysis.grammar_score || analysis.grammarScore || 0,
            readability: (analysis.readability_score || analysis.readability || 0),
            structureScore: analysis.structure_score || analysis.structureScore || 0,
            overallScore: analysis.overall_score || 0,
            weaknesses: analysis.weaknesses || [],
            suggestions: analysis.suggestions || [],
            recommendedKeywords: analysis.recommended_keywords || [],
            techSkills: analysis.tech_skills || [],
            softSkills: analysis.soft_skills || [],
            matchedSkills: analysis.matchedSkills || [],
            missingSkills: analysis.missingSkills || [],
            sectionAnalysis: analysis.section_analysis || {},
            metrics: analysis.metrics || {},
          };
          
          // Also store the complete analysis
          resume.completeAnalysis = analysis;
          
          await resume.save();
          console.log('✅ AI analysis completed for resume:', resume._id);
        } else {
          console.log('⚠️ AI analysis failed:', analyzeResponse.data.error);
        }
      }
    } catch (analysisError) {
      console.error('AI analysis failed (non-critical):', analysisError.message);
      // Don't fail the upload if analysis fails
    }

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        parsedData: resume.parsedData,
        aiAnalysis: resume.aiAnalysis,
        analysisPending: !pythonServiceAvailable,
        message: pythonServiceAvailable
          ? 'Resume uploaded and parsed successfully'
          : 'Resume uploaded successfully! AI analysis will be available once the analysis service is running. You can re-analyze from the Analysis page.',
      },
    });
  } catch (error) {
    console.error('[UPLOAD] Error uploading resume:', error.message);
    
    // Provide more detailed error info for debugging
    if (error.response?.status) {
      console.error(`[UPLOAD] Python service returned ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('[UPLOAD] Could not connect to Python service. Make sure it is running on port 5001');
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data?.error || 'Internal server error'
    });
  }
});

/**
 * POST /api/jobseeker/analyze/:resumeId
 * Analyze resume for ATS score and enhancement suggestions
 */
router.post('/jobseeker/analyze/:resumeId', authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.resumeId;
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Ensure user owns this resume
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get resume file path
    const filePath = path.join(__dirname, '../../uploads', resume.originalFile);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Resume file not found on server' });
    }
    
    // Call Python service to parse resume and get raw text
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream, resume.originalFile);

    const parseResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/parse-resume`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30 second timeout
    });

    if (!parseResponse.data.success) {
      return res.status(500).json({ success: false, error: 'Failed to extract text from resume' });
    }

    const resumeText = parseResponse.data.data.raw_text || parseResponse.data.data.rawText || '';

    if (!resumeText) {
      return res.status(500).json({ success: false, error: 'No text content extracted from resume' });
    }

    // Call Python service to analyze resume with AI
    const analyzeResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/analyze-resume`, {
      resumeText: resumeText,
      targetRole: resume.jobTarget || '',
    }, {
      timeout: 60000, // 60 second timeout for AI analysis
    });

    if (!analyzeResponse.data.success) {
      return res.status(500).json({ 
        success: false, 
        error: analyzeResponse.data.error || 'Failed to analyze resume' 
      });
    }

    const analysis = analyzeResponse.data.data;

    // Update resume with AI analysis
    resume.aiAnalysis = {
      atsScore: analysis.atsScore || 0,
      keywordDensity: analysis.keywordDensity || 0,
      grammarScore: analysis.grammarScore || 0,
      readability: typeof analysis.readability === 'number' ? analysis.readability : 0,
      structureScore: analysis.structureScore || 0,
      weaknesses: analysis.weaknesses || [],
      suggestions: analysis.suggestions || [],
    };

    await resume.save();

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        aiAnalysis: resume.aiAnalysis,
        enhancedSummary: analysis.enhancedSummary || '',
      },
    });
  } catch (error) {
    console.error('Analyze resume error:', error);
    
    // Provide more detailed error messages
    let errorMessage = error.message;
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Python AI service is not running. Please start the service.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'AI analysis timed out. Please try again.';
    }
    
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * GET /api/jobs/active
 * Get all active HR-posted jobs (for job seekers to browse)
 * Returns jobs with match scores if resumeId query param provided
 */
router.get('/jobs/active', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.query;

    // Fetch all active jobs posted by any HR
    const activeJobs = await Job.find({ status: 'active' })
      .populate('postedBy', 'name email company')
      .sort({ createdAt: -1 });

    console.log(`\n[ACTIVE-JOBS] Found ${activeJobs.length} active HR-posted jobs`);

    let resumeSkills = [];
    let resumeText = '';
    let resumeTarget = '';

    // If resumeId provided, extract skills for matching
    if (resumeId) {
      try {
        const resume = await Resume.findById(resumeId);
        if (resume && resume.user.toString() === req.user._id.toString()) {
          resumeSkills = (resume.parsedData?.skills || []).map(s => s.toLowerCase());
          resumeTarget = (resume.jobTarget || '').toLowerCase();
          resumeText = [
            resume.parsedData?.summary || '',
            ...(resume.parsedData?.experience || []).map(e => `${e.title || ''} ${e.description || ''}`),
            ...resumeSkills,
          ].join(' ').toLowerCase();
          console.log(`[ACTIVE-JOBS] Resume skills (${resumeSkills.length}): ${resumeSkills.slice(0, 10).join(', ')}`);
        }
      } catch (e) {
        console.warn('[ACTIVE-JOBS] Could not load resume for matching:', e.message);
      }
    }

    // Score each job against resume
    const scoredJobs = activeJobs.map(job => {
      const jobObj = job.toObject();
      let matchScore = 0;
      let matchedSkills = [];
      let missingSkills = [];

      if (resumeSkills.length > 0) {
        // Build job text from all relevant fields
        const jobText = [
          jobObj.title || '',
          jobObj.description || '',
          ...(jobObj.requirements || []),
          ...(jobObj.skillsRequired || []),
          ...(jobObj.responsibilities || []),
          jobObj.industry || '',
        ].join(' ').toLowerCase();

        // Find matched and missing skills
        matchedSkills = resumeSkills.filter(skill => jobText.includes(skill));
        missingSkills = (jobObj.skillsRequired || jobObj.requirements || [])
          .filter(req => !resumeSkills.some(s => req.toLowerCase().includes(s)))
          .slice(0, 5);

        // Calculate match score
        const skillMatch = resumeSkills.length > 0 ? (matchedSkills.length / resumeSkills.length) * 50 : 0;
        const titleMatch = jobObj.title && resumeTarget && jobObj.title.toLowerCase().includes(resumeTarget.split(' ')[0]) ? 25 : 0;
        const descMatch = jobText.split(' ').filter(w => resumeSkills.includes(w)).length > 3 ? 15 : 0;
        const reqMatch = matchedSkills.length >= 3 ? 10 : matchedSkills.length >= 1 ? 5 : 0;
        matchScore = Math.min(100, Math.round(skillMatch + titleMatch + descMatch + reqMatch));
      }

      return {
        _id: jobObj._id,
        title: jobObj.title,
        company: jobObj.company,
        location: jobObj.location,
        description: jobObj.description,
        salary: jobObj.salary,
        type: jobObj.type,
        experience: jobObj.experience,
        industry: jobObj.industry,
        requirements: jobObj.requirements || [],
        skillsRequired: jobObj.skillsRequired || [],
        responsibilities: jobObj.responsibilities || [],
        benefits: jobObj.benefits || [],
        postedDate: jobObj.postedDate || jobObj.createdAt,
        postedBy: jobObj.postedBy,
        source: 'Portal',
        matchScore,
        matchedSkills,
        missingSkills,
      };
    });

    // Sort by match score (highest first)
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: {
        jobs: scoredJobs,
        totalJobs: scoredJobs.length,
        hasResume: resumeSkills.length > 0,
      }
    });

  } catch (error) {
    console.error('[ACTIVE-JOBS] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/jobseeker/jobs/:resumeId
 * Get job recommendations based on resume
 */
router.get('/jobseeker/jobs/:resumeId', authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.resumeId;
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Ensure user owns this resume
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Build search keywords from resume
    const skills = resume.parsedData.skills.join(' ');
    const targetRole = resume.jobTarget || 'Software Engineer';
    const keywords = `${targetRole} ${skills}`.trim();

    console.log(`\n📋 Fetching jobs for resume: ${resumeId}`);
    console.log(`   Keywords: ${keywords}`);
    console.log(`   Python Service URL: ${PYTHON_SERVICE_URL}`);

    // Call Python service to scrape jobs
    const jobsResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/scrape-jobs`, {
      keywords: keywords,
      location: 'Pakistan',
      platforms: ['rozee', 'mustakbil'],
    }, { timeout: 30000 });

    console.log(`   Response status: ${jobsResponse.status}`);
    console.log(`   Response success: ${jobsResponse.data.success}`);

    if (!jobsResponse.data.success) {
      console.error(`   ❌ Job scraping failed: ${jobsResponse.data.error}`);
      return res.status(500).json({ success: false, error: 'Failed to fetch jobs: ' + (jobsResponse.data.error || 'Unknown error') });
    }

    const jobs = jobsResponse.data.data.jobs || [];
    console.log(`   Found ${jobs.length} jobs`);

    // Save jobs to database
    const savedJobs = [];
    for (const job of jobs.slice(0, 20)) { // Limit to top 20 jobs
      const existingJob = await Job.findOne({ url: job.url });
      
      if (!existingJob) {
        const newJob = new Job({
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          url: job.url,
          platform: job.platform,
          postedDate: job.postedDate || new Date(),
        });
        await newJob.save();
        savedJobs.push(newJob);
      } else {
        savedJobs.push(existingJob);
      }
    }

    console.log(`   ✅ Saved ${savedJobs.length} jobs`);

    res.json({
      success: true,
      data: {
        jobs: savedJobs,
        totalFound: jobs.length,
      },
    });
  } catch (error) {
    console.error('❌ Get jobs error:', error.message);
    console.error('   Full error:', error);
    res.status(500).json({ success: false, error: error.message, details: process.env.NODE_ENV === 'development' ? error.toString() : 'Internal server error' });
  }
});

/**
 * GET /api/jobseeker/my-resumes
 * Get all resumes for the logged-in user
 */
router.get('/jobseeker/my-resumes', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`📄 Fetching resumes for user: ${userId}`);
    
    const resumes = await Resume.find({ user: userId }).sort({ createdAt: -1 }).lean();
    
    console.log(`✅ Found ${resumes.length} resumes`);
    
    if (resumes.length === 0) {
      console.log('⚠️ No resumes found for user');
      return res.json({ 
        success: true, 
        data: {
          resumes: [],
          count: 0
        }
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        resumes: resumes,
        count: resumes.length
      }
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// HR ROUTES
// ============================================

/**
 * POST /api/hr/detect-anomalies
 * Check resumes for anomaly indicators
 */
router.post('/hr/detect-anomalies', authMiddleware, async (req, res) => {
  try {
    const { resumeIds } = req.body;

    if (!resumeIds || resumeIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No resume IDs provided' });
    }

    const anomalyReports = [];

    for (const resumeId of resumeIds) {
      const resume = await Resume.findById(resumeId);
      
      if (!resume) continue;

      // Get resume text
      const filePath = path.join(__dirname, '../../uploads', resume.originalFile);
      
      if (!fs.existsSync(filePath)) continue;
      
      const fileBuffer = fs.readFileSync(filePath);
      const formData = new FormData();
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob, resume.originalFile);

      const parseResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/parse-resume`, formData);
      const resumeText = parseResponse.data.data.rawText || '';

      // Get all existing resumes for duplicate detection
      const allResumes = await Resume.find({ _id: { $ne: resumeId } });
      const existingResumesData = allResumes.map(r => ({
        id: r._id.toString(),
        text: `${r.parsedData.name} ${r.parsedData.email} ${r.parsedData.skills.join(' ')}`,
      }));

      // Call Python service to detect anomalies
      const anomalyResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/detect-anomalies`, {
        parsedData: resume.parsedData,
        resumeText: resumeText,
        existingResumes: existingResumesData,
      });

      if (anomalyResponse.data.success) {
        const anomalyData = anomalyResponse.data.data;

        // Save anomaly report
        const report = new AnomalyReport({
          resume: resumeId,
          riskScore: anomalyData.riskScore || 0,
          riskLevel: anomalyData.riskLevel || 'Low',
          indicators: anomalyData.indicators || [],
          duplicates: anomalyData.duplicates || [],
          recommendations: anomalyData.recommendations || [],
          status: anomalyData.riskScore > 50 ? 'flagged' : 'cleared',
        });

        await report.save();
        anomalyReports.push(report);
      }
    }

    res.json({
      success: true,
      data: {
        reports: anomalyReports,
      },
    });
  } catch (error) {
    console.error('Detect anomalies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hr/rank-resumes
 * Rank resumes against a job description
 */
router.post('/hr/rank-resumes', authMiddleware, async (req, res) => {
  try {
    const { jobDescription, resumeIds } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ success: false, error: 'Job description is required' });
    }

    if (!resumeIds || resumeIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No resume IDs provided' });
    }

    // Prepare resumes for ranking
    const resumesData = [];

    for (const resumeId of resumeIds) {
      const resume = await Resume.findById(resumeId);
      
      if (!resume) continue;

      // Get resume text
      const filePath = path.join(__dirname, '../../uploads', resume.originalFile);
      
      if (!fs.existsSync(filePath)) continue;
      
      const fileBuffer = fs.readFileSync(filePath);
      const formData = new FormData();
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob, resume.originalFile);

      const parseResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/parse-resume`, formData);
      const resumeText = parseResponse.data.data.rawText || '';

      resumesData.push({
        id: resumeId,
        text: resumeText,
        candidateName: resume.parsedData.name || 'Unknown',
      });
    }

    // Call Python service to rank resumes
    const rankResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/rank-resumes`, {
      jobDescription: jobDescription,
      resumes: resumesData,
    });

    if (!rankResponse.data.success) {
      return res.status(500).json({ success: false, error: 'Failed to rank resumes' });
    }

    const rankings = rankResponse.data.data.rankings;

    // Save matches to database
    const savedMatches = [];

    for (const ranking of rankings) {
      const match = new Match({
        resume: ranking.resumeId,
        jobDescription: jobDescription,
        matchScore: ranking.matchScore,
        rank: ranking.rank,
        strengths: ranking.strengths || [],
        weaknesses: ranking.weaknesses || [],
      });

      await match.save();
      savedMatches.push(match);
    }

    res.json({
      success: true,
      data: {
        rankings: savedMatches,
      },
    });
  } catch (error) {
    console.error('Rank resumes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hr/all-resumes
 * Get all resumes: HR-uploaded + job seeker application resumes
 */
router.get('/hr/all-resumes', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Resumes HR uploaded directly
    const hrUploadedResumes = await Resume.find({ user: userId }).sort({ createdAt: -1 });

    // 2. Resumes from job seeker applications to this HR's jobs
    const hrApplications = await Application.find({ hr: userId })
      .populate({
        path: 'resume',
        model: 'Resume',
        select: 'parsedData aiAnalysis anomalyDetection decisionStatus jobTarget originalFile createdAt user'
      })
      .populate('jobSeeker', 'name email')
      .populate('job', 'title company')
      .sort({ appliedAt: -1 });

    // Build a set of already-included resume IDs (HR uploaded)
    const hrResumeIds = new Set(hrUploadedResumes.map(r => r._id.toString()));

    // Map application resumes into the same format, with extra applicant info
    const applicationResumes = hrApplications
      .filter(app => app.resume && !hrResumeIds.has(app.resume._id?.toString()))
      .map(app => {
        const resumeObj = app.resume.toObject ? app.resume.toObject() : app.resume;
        return {
          ...resumeObj,
          _applicationId: app._id,
          _isApplicant: true,
          _applicantName: app.jobSeeker?.name || resumeObj.parsedData?.name || 'Unknown',
          _applicantEmail: app.jobSeeker?.email || resumeObj.parsedData?.email || '',
          _jobTitle: app.job?.title || 'Unknown Job',
          _matchScore: app.matchScore || 0,
          _applicationStatus: app.status || 'pending',
          _appliedAt: app.appliedAt || app.createdAt,
        };
      });

    const allResumes = [...hrUploadedResumes, ...applicationResumes];

    res.json({ success: true, data: allResumes });
  } catch (error) {
    console.error('Get all resumes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hr/anomaly-reports
 * Get all anomaly reports
 */
router.get('/hr/anomaly-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await AnomalyReport.find().populate('resume').sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get anomaly reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hr/jobs
 * Get all jobs posted by HR
 */
router.get('/hr/jobs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    // Get jobs created by this HR user
    const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 });
    
    // If no jobs found, return empty array
    res.json({ 
      success: true, 
      data: jobs || []
    });
  } catch (error) {
    console.error('Get HR jobs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hr/jobs
 * Create a new job posting
 */
router.post('/hr/jobs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      company,
      location,
      type,
      salary,
      description,
      requirements,
      responsibilities,
      benefits,
      experience,
      industry,
      status
    } = req.body;

    // Validate required fields
    if (!title || !company || !location || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, company, location, description' 
      });
    }

    // Capitalize type for enum validation
    const jobType = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Full-time';

    const job = new Job({
      title,
      company,
      location,
      type: jobType,
      salary: salary || 'Competitive',
      description,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      benefits: benefits || [],
      experience: experience || 'Not specified',
      industry: industry || 'Technology',
      postedBy: userId,
      postedDate: new Date(),
      status: status || 'active'
    });

    await job.save();

    res.json({
      success: true,
      data: job,
      message: 'Job posted successfully'
    });
  } catch (error) {
    console.error('Create job error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/hr/jobs/:id
 * Update a job posting
 */
router.put('/hr/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user._id;
    const updates = req.body;

    // Find job and verify ownership
    const job = await Job.findOne({ _id: jobId, postedBy: userId });
    
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found or you do not have permission to edit it' 
      });
    }

    // Capitalize type if present
    if (updates.type) {
      updates.type = updates.type.charAt(0).toUpperCase() + updates.type.slice(1);
    }

    // Update job fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== '_id' && key !== 'postedBy') {
        job[key] = updates[key];
      }
    });

    await job.save();

    res.json({
      success: true,
      data: job,
      message: 'Job updated successfully'
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/hr/jobs/:id
 * Delete a job posting
 */
router.delete('/hr/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user._id;

    // Find and delete job
    const job = await Job.findOneAndDelete({ _id: jobId, postedBy: userId });
    
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found or you do not have permission to delete it' 
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hr/upload-resumes
 * Upload multiple resumes (no processing - just save files)
 */
router.post('/hr/upload-resumes', authMiddleware, upload.array('resumes', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const userId = req.user._id;
    const uploadedResumes = [];
    const errors = [];

    console.log(`\n📤 Uploading ${req.files.length} resume(s)...`);

    // Just save file info to database (no AI processing yet)
    for (const file of req.files) {
      try {
        // Create resume record with minimal data
        const resume = new Resume({
          user: userId,
          originalFile: file.filename,
          originalFileName: file.originalname, // Save original uploaded filename
          parsedData: {
            name: file.originalname.replace(/\.(pdf|docx)$/i, ''), // Use filename as temporary name
            email: '',
            phone: '',
            education: [],
            experience: [],
            skills: [],
            summary: '',
          },
          aiAnalysis: {
            atsScore: 0,
            keywordDensity: 0,
            grammarScore: 0,
            readability: 0,
            structureScore: 0,
            weaknesses: [],
            suggestions: [],
          },
        });

        await resume.save();
        
        uploadedResumes.push({
          id: resume._id,
          fileName: file.originalname,
          filePath: file.path,
          uploadedAt: new Date(),
          status: 'pending', // Pending AI screening
          success: true
        });
        
        console.log(`   ✅ Uploaded: ${file.originalname}`);
      } catch (saveError) {
        console.error(`   ❌ Failed to save ${file.originalname}:`, saveError.message);
        errors.push({
          fileName: file.originalname,
          error: 'Failed to save to database'
        });
      }
    }

    console.log(`\n✅ Upload complete: ${uploadedResumes.length} files saved`);

    res.json({
      success: true,
      data: {
        uploaded: uploadedResumes,
        errors: errors,
        total: req.files.length,
        successful: uploadedResumes.length,
        failed: errors.length,
      },
      message: `Uploaded ${uploadedResumes.length} of ${req.files.length} resumes. Run AI Screening to analyze.`
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to upload resumes' 
    });
  }
});

/**
 * DELETE /api/hr/resumes/:id
 * Delete a resume by ID (HR only)
 */
router.delete('/hr/resumes/:id', authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user._id;

    console.log(`\n🗑️ Deleting resume ${resumeId} by user ${userId}...`);

    // Find the resume
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      console.log(`   ❌ Resume not found: ${resumeId}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Resume not found' 
      });
    }

    // Verify ownership (resume belongs to this HR user)
    if (resume.user.toString() !== userId.toString()) {
      console.log(`   ❌ Unauthorized: Resume belongs to different user`);
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized to delete this resume' 
      });
    }

    // Delete the physical file if it exists
    if (resume.originalFile) {
      const filePath = path.join(__dirname, '../../uploads', resume.originalFile);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`   🗑️ Deleted file: ${resume.originalFile}`);
        } catch (fileError) {
          console.error(`   ⚠️ Failed to delete file:`, fileError.message);
          // Continue anyway - we'll still delete the database record
        }
      }
    }

    // Delete associated matches
    const matchDeleteResult = await Match.deleteMany({ resume: resumeId });
    if (matchDeleteResult.deletedCount > 0) {
      console.log(`   🗑️ Deleted ${matchDeleteResult.deletedCount} associated match(es)`);
    }

    // Delete the resume from database
    await Resume.findByIdAndDelete(resumeId);

    console.log(`   ✅ Resume deleted successfully`);

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete resume' 
    });
  }
});

/**
 * POST /api/hr/run-ai-screening
 * Run AI screening on pending resumes
 */
router.post('/hr/run-ai-screening', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    let { jobDescription, resumeIds, anomalyThreshold = 30, matchThreshold = 50, atsThreshold = 60 } = req.body;
    
    console.log(`\n🔍 RAW REQUEST BODY:`, JSON.stringify(req.body, null, 2));
    
    // 🔴 ENSURE THRESHOLDS ARE NUMBERS (handle 0 correctly)
    atsThreshold = typeof atsThreshold === 'number' && atsThreshold >= 0 ? atsThreshold : (Number(atsThreshold) || 60);
    anomalyThreshold = typeof anomalyThreshold === 'number' && anomalyThreshold >= 0 ? anomalyThreshold : (Number(anomalyThreshold) || 30);
    matchThreshold = typeof matchThreshold === 'number' && matchThreshold >= 0 ? matchThreshold : (Number(matchThreshold) || 50);

    console.log(`🔍 AI SCREENING: ATS=${atsThreshold}%, Anomaly=${anomalyThreshold}, Match=${matchThreshold}%, Resumes=${resumeIds ? resumeIds.length : 'all'}`);

    // Build query for resumes
    let query = {};

    // If specific resume IDs are provided, process those (allow reprocessing)
    if (resumeIds && Array.isArray(resumeIds) && resumeIds.length > 0) {
      // Convert string IDs to MongoDB ObjectId if needed
      const objectIds = resumeIds.map(id => {
        try {
          return new ObjectId(id);
        } catch (e) {
          console.warn(`   ⚠️ Invalid resume ID format: ${id}`);
          return id;
        }
      });
      query._id = { $in: objectIds };
      console.log(`   Query mode: SELECTED RESUMES (allow reprocessing)`);
      console.log(`   Converted IDs:`, objectIds);
    } else {
      // Only filter by atsScore when processing all resumes (not specific IDs)
      query.user = userId;
      query['aiAnalysis.atsScore'] = 0;
      console.log(`   Query mode: ALL PENDING RESUMES`);
    }

    console.log(`   Final Query:`, JSON.stringify(query));

    // Get resumes to process
    const resumes = await Resume.find(query);
    console.log(`   Found ${resumes.length} resumes in database`);
    
    // Log details of found resumes
    if (resumes.length > 0) {
      resumes.forEach((resume, idx) => {
        console.log(`   [${idx + 1}] Resume: ${resume.originalFile}, User: ${resume.user}, ID: ${resume._id}`);
      });
    } else {
      // Diagnostic: Check if resumes exist with these IDs at all
      console.log(`   🔍 DIAGNOSTIC: Checking if resumes exist with these IDs...`);
      const allResumesWithIds = await Resume.find({ _id: { $in: resumeIds.map(id => new ObjectId(id)) } });
      console.log(`   Found ${allResumesWithIds.length} resumes with these IDs (any user)`);
      if (allResumesWithIds.length > 0) {
        allResumesWithIds.forEach((resume, idx) => {
          console.log(`   [${idx + 1}] Resume: ${resume.originalFile}, User: ${resume.user}`);
        });
      }
    }

    if (resumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: resumeIds && resumeIds.length > 0 
          ? 'No resumes found in your selection.'
          : 'No pending resumes found. All resumes have been processed.'
      });
    }

    console.log(`\n🤖 Running AI Screening on ${resumes.length} resume(s)...`);
    if (resumeIds && resumeIds.length > 0) {
      console.log(`   📋 Processing selected resumes only`);
    }

    // Test Python service connection first
    try {
      console.log(`   🔍 Testing Python AI Service at: ${PYTHON_SERVICE_URL}/health`);
      const healthCheck = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 5000 });
      console.log(`   ✅ Python AI Service connected: ${healthCheck.data.ai_provider}`);
      console.log(`   Response status: ${healthCheck.status}`);
    } catch (healthError) {
      console.error(`   ❌ Python AI Service not reachable at ${PYTHON_SERVICE_URL}`);
      console.error(`   Error message: ${healthError.message}`);
      console.error(`   Error code: ${healthError.code}`);
      if (healthError.response) {
        console.error(`   Response status: ${healthError.response.status}`);
        console.error(`   Response data:`, healthError.response.data);
      }
      return res.status(503).json({
        success: false,
        error: 'AI Service is not available. Please ensure Python service is running on port 5001.',
        details: healthError.message,
        pythonServiceUrl: PYTHON_SERVICE_URL
      });
    }

    const processedResumes = [];
    const errors = [];

    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`📋 STARTING RESUME PROCESSING LOOP`);
    console.log(`═══════════════════════════════════════════════════════════`);

    // Process each resume
    for (let resumeIndex = 0; resumeIndex < resumes.length; resumeIndex++) {
      const resume = resumes[resumeIndex];
      try {
        console.log(`\n[${resumeIndex + 1}/${resumes.length}] ─────────────────────────────────────────────`);
        const filePath = path.join(__dirname, '../../uploads', resume.originalFile);

        console.log(`   📂 File path: ${filePath}`);
        console.log(`   🔍 File exists: ${fs.existsSync(filePath)}`);

        if (!fs.existsSync(filePath)) {
          console.log(`   ❌ File not found: ${resume.originalFile}`);
          errors.push({
            resumeId: resume._id,
            fileName: resume.originalFile,
            error: 'File not found'
          });
          continue;
        }

        console.log(`\n📄 Processing: ${resume.originalFile}`);
        console.log(`   Resume ID: ${resume._id}`);

        // Step 1: Parse resume
        console.log(`   ⏳ Step 1: Parsing resume...`);
        const formData = new FormData();
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream, resume.originalFile);

        const parseResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/parse-resume`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        });

        console.log(`   Response status: ${parseResponse.status}`);
        console.log(`   Response success: ${parseResponse.data.success}`);

        if (!parseResponse.data.success) {
          throw new Error('Failed to parse resume: ' + (parseResponse.data.error || 'Unknown error'));
        }

        const parsedData = parseResponse.data.data;
        
        // Flatten the parsed data structure for fraud detection
        const flattenedData = {
          name: parsedData.candidate_info?.name || parsedData.name || 'Unknown',
          email: parsedData.candidate_info?.email || parsedData.email || '',
          phone: parsedData.candidate_info?.phone || parsedData.phone || '',
          skills: parsedData.skills || [],
          education: parsedData.education || [],
          experience: parsedData.experience || [],
          summary: parsedData.summary || parsedData.raw_text || '',
          raw_text: parsedData.raw_text || ''
        };
        
        console.log(`   ✅ Step 1 Complete - Parsed: ${flattenedData.name}`);

        // Step 2 & 3: AI Analysis + Anomaly Detection (PARALLEL for speed)
        console.log(`   ⏳ Step 2+3: AI Analysis + Anomaly Detection (parallel)...`);
        const [analyzeResponse, anomalyResponse] = await Promise.all([
          axios.post(`${PYTHON_SERVICE_URL}/api/analyze-resume`, {
            resumeText: flattenedData.raw_text || '',
            jobDescription: jobDescription || '',
            parsedSkills: flattenedData.skills || [],
            anomalyThreshold,
            matchThreshold
          }, { timeout: 60000 }),
          axios.post(`${PYTHON_SERVICE_URL}/api/detect-anomalies`, {
            resumeText: flattenedData.raw_text || '',
            resumeData: flattenedData
          }, { timeout: 30000 })
        ]);

        const aiAnalysis = analyzeResponse.data.success ? analyzeResponse.data.data : {};
        const anomalyReport = anomalyResponse.data.success ? anomalyResponse.data.data : {};
        console.log(`   ✅ Step 2+3 Complete - ATS: ${aiAnalysis.ats_score || 0}%, Anomaly: ${anomalyReport.risk_level || 'Unknown'}`);

        // Update resume with flattened data
        resume.parsedData = {
          name: flattenedData.name || '',
          email: flattenedData.email || '',
          phone: flattenedData.phone || '',
          education: flattenedData.education || [],
          experience: flattenedData.experience || [],
          skills: flattenedData.skills || [],
          summary: flattenedData.summary || flattenedData.raw_text || '',
        };

        resume.aiAnalysis = {
          atsScore: aiAnalysis.ats_score || 0,
          keywordDensity: aiAnalysis.keyword_density || 0,
          grammarScore: aiAnalysis.grammar_score || 0,
          readability: aiAnalysis.readability_score || 0,
          structureScore: aiAnalysis.structure_score || 0,
          weaknesses: aiAnalysis.weaknesses || [],
          suggestions: aiAnalysis.suggestions || [],
        };

        await resume.save();

        // Create anomaly report if needed
        if (anomalyReport && (anomalyReport.risk_level === 'Medium' || anomalyReport.risk_level === 'High')) {
          const existingReport = await AnomalyReport.findOne({ resume: resume._id });

          if (!existingReport) {
            const newAnomalyReport = new AnomalyReport({
              resume: resume._id,
              reportedBy: userId,
              riskScore: anomalyReport.risk_score || 0,
              indicators: anomalyReport.indicators || [],
              status: 'pending',
              priority: anomalyReport.risk_level === 'High' ? 'high' : 'medium'
            });
            await newAnomalyReport.save();
            console.log(`   ⚠️ Anomaly report created - ${anomalyReport.risk_level} risk`);
          }
        }

        // Determine decision status based on ATS score and threshold
        const atsScore = aiAnalysis.ats_score || 0;
        let decisionStatus = 'NEEDS_REVIEW';
        let decisionReason = '';

        if (atsScore >= atsThreshold) {
          decisionStatus = 'SHORTLISTED';
          decisionReason = `ATS Score (${atsScore}%) meets or exceeds threshold (${atsThreshold}%)`;
        } else if (atsScore >= (atsThreshold - 10)) {
          decisionStatus = 'NEEDS_REVIEW';
          decisionReason = `ATS Score (${atsScore}%) is within 10% of threshold (${atsThreshold}%) - Requires manual review`;
        } else {
          decisionStatus = 'REJECTED';
          decisionReason = `ATS Score (${atsScore}%) is more than 10% below threshold (${atsThreshold}%)`;
        }

        console.log(`   📊 ${flattenedData.name}: ATS=${atsScore}% → ${decisionStatus}`);

        // 🔴 SAVE DECISION TO DATABASE
        resume.decisionStatus = decisionStatus;
        resume.decisionReason = decisionReason;
        resume.atsThresholdUsed = atsThreshold;
        resume.lastScreeningDate = new Date();
        await resume.save();

        processedResumes.push({
          id: resume._id,
          name: flattenedData.name,
          email: flattenedData.email,
          phone: flattenedData.phone,
          atsScore: aiAnalysis.ats_score || 0,
          matchScore: aiAnalysis.match_score || 0,
          qualityScore: aiAnalysis.quality_score || 0,
          anomalyWeight: aiAnalysis.anomaly_weight || 0,
          anomalyCount: aiAnalysis.anomaly_count || 0,
          anomalySeverity: aiAnalysis.anomaly_severity || 'none',
          anomalies: aiAnalysis.anomalies || [],
          decisionStatus: decisionStatus,
          reason: decisionReason,
          recommendation: aiAnalysis.recommendation || 'Continue with standard evaluation process',
          fraudRisk: anomalyReport.risk_level || 'Low',
          matchedSkills: aiAnalysis.matchedSkills || [],
          missingSkills: aiAnalysis.missingSkills || [],
          skills: flattenedData.skills?.slice(0, 5) || [],
          education: flattenedData.education || [],
          experience: flattenedData.experience || [],
          weaknesses: aiAnalysis.weaknesses || [],
          decision: decisionStatus
        });
        
        console.log(`   ✅ [${resumeIndex + 1}/${resumes.length}] COMPLETE`);

      } catch (processError) {
        console.error(`\n❌ ERROR [${resumeIndex + 1}/${resumes.length}] processing ${resume.originalFile}:`);
        console.error(`   Message: ${processError.message}`);
        console.error(`   Code: ${processError.code}`);
        if (processError.response) {
          console.error(`   Status: ${processError.response.status}`);
          console.error(`   Response Data:`, processError.response.data);
        }
        console.error(`   Stack:`, processError.stack.split('\n').slice(0, 3).join('\n'));
        
        errors.push({
          resumeId: resume._id,
          fileName: resume.originalFile,
          error: processError.message,
          details: processError.response?.data
        });
      }
    }

    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`✅ PROCESSING LOOP COMPLETE`);
    console.log(`═══════════════════════════════════════════════════════════`);

    // Step 4: Rank resumes if job description provided
    if (jobDescription && processedResumes.length > 1) {
      console.log(`\n📊 Ranking ${processedResumes.length} resume(s)...`);

      try {
        const resumesForRanking = await Resume.find({
          _id: { $in: processedResumes.map(r => r.id) }
        });

        const rankResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/rank-resumes`, {
          resumes: resumesForRanking.map(r => ({
            name: r.parsedData.name,
            email: r.parsedData.email,
            skills: r.parsedData.skills,
            education: r.parsedData.education,
            experience: r.parsedData.experience,
            raw_text: r.parsedData.summary
          })),
          jobDescription: jobDescription
        }, {
          timeout: 60000,
        });

        if (rankResponse.data.success) {
          const rankings = rankResponse.data.data.ranked_resumes;
          processedResumes.forEach((resume, index) => {
            const ranked = rankings.find(r => r.name === resume.name);
            if (ranked) {
              resume.matchScore = ranked.match_score;
              resume.rank = rankings.indexOf(ranked) + 1;
            }
          });
          processedResumes.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          console.log(`   ✅ Ranked resumes by match score`);
        }
      } catch (rankError) {
        console.error(`   ⚠️ Ranking failed:`, rankError.message);
      }
    }

    console.log(`\n✅ AI Screening complete: ${processedResumes.length} processed, ${errors.length} failed`);
    console.log(`\n📊 RESULTS SUMMARY:`);
    console.log(`   ├─ Total Resumes: ${resumes.length}`);
    console.log(`   ├─ Successfully Processed: ${processedResumes.length}`);
    console.log(`   ├─ Failed: ${errors.length}`);
    console.log(`   ├─ Job Ranked: ${!!jobDescription}`);
    console.log(`   └─ Response ready to send`);
    
    // Log all processed resume details
    if (processedResumes.length > 0) {
      console.log(`\n📋 PROCESSED RESUMES:`);
      processedResumes.forEach((resume, idx) => {
        console.log(`   [${idx + 1}] ${resume.name}`);
        console.log(`       ├─ Email: ${resume.email}`);
        console.log(`       ├─ ATS Score: ${resume.atsScore}%`);
        console.log(`       ├─ Fraud Risk: ${resume.fraudRisk}`);
        console.log(`       ├─ Skills: ${resume.skills.join(', ')}`);
        console.log(`       └─ Match Score: ${resume.matchScore ? resume.matchScore + '%' : 'N/A'}`);
      });
    }
    
    // Log errors if any
    if (errors.length > 0) {
      console.log(`\n⚠️ FAILED RESUMES:`);
      errors.forEach((error, idx) => {
        console.log(`   [${idx + 1}] ${error.fileName}`);
        console.log(`       ├─ Error: ${error.error}`);
        console.log(`       └─ Details: ${JSON.stringify(error.details)}`);
      });
    }

    res.json({
      success: true,
      data: {
        processed: processedResumes,
        errors: errors,
        total: resumes.length,
        successful: processedResumes.length,
        failed: errors.length,
        ranked: !!jobDescription
      },
      message: `AI Screening complete! Processed ${processedResumes.length} of ${resumes.length} resumes.`
    });

  } catch (error) {
    console.error('❌ AI Screening Critical Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run AI screening',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/hr/stats
 * Get dashboard statistics for HR
 */
router.get('/hr/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts
    const totalJobs = await Job.countDocuments({ postedBy: userId });
    const activeJobs = await Job.countDocuments({ postedBy: userId, status: 'active' });
    const totalResumes = await Resume.countDocuments();
    const totalMatches = await Match.countDocuments();
    const anomalyReports = await AnomalyReport.countDocuments({ status: 'pending' });

    // Get recent activity
    const recentResumes = await Resume.find().sort({ createdAt: -1 }).limit(5);
    const recentJobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        totalResumes,
        totalMatches,
        anomalyReports,
        recentResumes,
        recentJobs
      }
    });
  } catch (error) {
    console.error('Get HR stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/filter-tech-keywords
 * Filter keywords to only tech/IT-related using AI
 */
router.post('/filter-tech-keywords', authMiddleware, async (req, res) => {
  try {
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ success: false, error: 'Keywords array required' });
    }

    const response = await axios.post(`${PYTHON_SERVICE_URL}/api/filter-tech-keywords`, {
      keywords,
    }, { timeout: 15000 });

    res.json(response.data);
  } catch (error) {
    console.error('[FILTER-KEYWORDS] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});



/**
 * POST /api/change-password
 * Change user password (requires current password)
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.password) {
      return res.status(400).json({ success: false, error: 'Password change not available for OAuth accounts' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/upload-profile-picture
 * Upload user profile picture
 */
const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
  }
});
const profilePicUpload = multer({
  storage: profilePicStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

router.post('/upload-profile-picture', authMiddleware, profilePicUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });
    res.json({ success: true, avatar: avatarUrl });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// JOB API SEARCH (Remotive + Jobicy + Arbeitnow + USAJobs)
// ==========================================================

/**
 * POST /api/jobseeker/search-jobs-api
 * Search real jobs from Remotive, Jobicy, Arbeitnow and USAJobs APIs
 * Can be used with custom keywords or auto-extracted from resume
 */
router.post('/jobseeker/search-jobs-api', authMiddleware, async (req, res) => {
  try {
    const { query, location, resumeId, platforms, max_per_platform } = req.body;

    let searchQuery = query || '';
    let resumeInfo = null;

    // If resumeId is provided, extract keywords from resume
    if (resumeId) {
      const resume = await Resume.findById(resumeId);
      if (resume && resume.user.toString() === req.user._id.toString()) {
        const skills = resume.parsedData?.skills || [];
        const targetRole = resume.jobTarget || '';
        
        // Build search query from resume if no custom query given
        if (!searchQuery) {
          searchQuery = targetRole || skills.slice(0, 3).join(' ') || 'Developer';
        }
        
        resumeInfo = {
          id: resume._id,
          name: resume.parsedData?.name || 'Candidate',
          targetRole: targetRole,
          skills: skills,
        };
      }
    }

    if (!searchQuery) {
      return res.status(400).json({ success: false, error: 'Please provide a search query or resume ID' });
    }

    console.log(`\n[JOB-API-SEARCH] Query: "${searchQuery}" | Location: "${location || 'Any'}"`);

    // Call Python Job API service
    const response = await axios.post(`${PYTHON_SERVICE_URL}/api/search-jobs-api`, {
      query: searchQuery,
      location: location || '',
      max_per_platform: max_per_platform || 10,
      platforms: platforms || ['remotive', 'themuse', 'arbeitnow', 'usajobs'],
    }, { timeout: 30000 });

    if (!response.data.success) {
      return res.status(500).json({ success: false, error: response.data.error || 'API search failed' });
    }

    const apiJobs = response.data.data?.jobs || [];
    
    // Apply skill matching if we have resume info
    let scoredJobs = apiJobs.map((job, idx) => {
      let matchScore = 0;
      let matchedSkills = [];
      let missingSkills = [];
      
      if (resumeInfo && resumeInfo.skills.length > 0) {
        const jobText = `${job.title} ${job.description || ''} ${(job.keywords || []).join(' ')}`.toLowerCase();
        const skills = resumeInfo.skills.map(s => s.toLowerCase());
        
        matchedSkills = skills.filter(s => jobText.includes(s));
        missingSkills = skills.filter(s => !jobText.includes(s)).slice(0, 5);
        
        // Calculate match score
        const skillScore = skills.length > 0 ? (matchedSkills.length / skills.length) * 60 : 30;
        const titleMatch = job.title?.toLowerCase().includes(searchQuery.toLowerCase().split(' ')[0]) ? 25 : 0;
        const hasKeywords = (job.keywords || []).some(k => skills.includes(k.toLowerCase())) ? 15 : 0;
        matchScore = Math.min(100, Math.round(skillScore + titleMatch + hasKeywords));
      } else {
        matchScore = Math.max(40, 85 - idx * 3); // Default scoring by relevance order
      }
      
      return {
        id: `${job.source?.toLowerCase() || 'api'}-${Date.now()}-${idx}`,
        title: job.title || 'Untitled',
        company: job.company || 'Unknown Company',
        location: job.location || 'Remote',
        description: job.description || '',
        url: job.url || '#',
        source: job.source || 'API',
        posted_date: job.posted_date || 'Recently',
        salary: job.salary || '',
        job_type: job.job_type || 'Full-Time',
        matchScore: matchScore,
        matchedSkills: matchedSkills,
        missingSkills: missingSkills,
        keywords: job.keywords || [],
        category: job.category || '',
        department: job.department || '',
      };
    });

    // Sort by match score
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Group by platform
    const jobsByPlatform = {};
    scoredJobs.forEach(job => {
      const key = (job.source || 'other').toLowerCase();
      if (!jobsByPlatform[key]) jobsByPlatform[key] = [];
      jobsByPlatform[key].push(job);
    });

    console.log(`[JOB-API-SEARCH] Found ${scoredJobs.length} jobs from APIs`);

    res.json({
      success: true,
      data: {
        jobs: scoredJobs,
        jobsByPlatform: jobsByPlatform,
        resumeInfo: resumeInfo,
        statistics: response.data.data?.statistics || {},
      }
    });

  } catch (error) {
    console.error('[JOB-API-SEARCH] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/jobseeker/find-matching-jobs
 * Find matching jobs for a resume from multiple platforms
 * Uses NLP + Semantic matching via Python AI service
 */
router.post('/jobseeker/find-matching-jobs', authMiddleware, async (req, res) => {
  try {
    const { resumeId, jobTarget, location } = req.body;

    if (!resumeId) {
      return res.status(400).json({ success: false, error: 'Resume ID required' });
    }

    console.log(`\n🔍 Finding matching jobs for resume: ${resumeId}`);

    // Get resume from database
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Ensure user owns this resume
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    console.log(`✅ Resume found: ${resume.parsedData?.name || 'Unknown'}`);

    // ══════════════════════════════════════════════════════════════
    //  SMART TARGET JOB TITLE EXTRACTION
    //  Instead of defaulting to "Developer", extract from resume context
    // ══════════════════════════════════════════════════════════════
    let targetJobTitle = jobTarget || resume.jobTarget || '';
    if (!targetJobTitle || targetJobTitle === 'Developer') {
      // Try to extract from experience titles
      const expTitles = (resume.parsedData?.experience || [])
        .map(e => e.title || e.position || '')
        .filter(t => t.length > 2);
      if (expTitles.length > 0) {
        targetJobTitle = expTitles[0]; // Use most recent job title
      }
    }
    if (!targetJobTitle || targetJobTitle === 'Developer') {
      // Try to infer from summary
      const summary = (resume.parsedData?.summary || '').toLowerCase();
      const rolePatterns = [
        /\b(data\s*(?:analyst|scientist|engineer))\b/i,
        /\b(software\s*(?:engineer|developer))\b/i,
        /\b(web\s*developer)\b/i,
        /\b(frontend|front[- ]end)\s*developer\b/i,
        /\b(backend|back[- ]end)\s*developer\b/i,
        /\b(full[- ]?stack)\s*developer\b/i,
        /\b(python|java|node|react|angular)\s*developer\b/i,
        /\b(machine\s*learning\s*engineer)\b/i,
        /\b(devops\s*engineer)\b/i,
        /\b(business\s*analyst)\b/i,
        /\b(project\s*manager)\b/i,
        /\b(qa\s*engineer|tester)\b/i,
        /\b(ui[\/\s]?ux\s*designer)\b/i,
        /\b(graphic\s*designer)\b/i,
      ];
      for (const pattern of rolePatterns) {
        const match = summary.match(pattern);
        if (match) {
          targetJobTitle = match[1];
          break;
        }
      }
    }
    if (!targetJobTitle || targetJobTitle === 'Developer') {
      // Infer from skills
      const skills = (resume.parsedData?.skills || []).map(s => s.toLowerCase());
      if (skills.some(s => s.includes('data') || s.includes('pandas') || s.includes('tableau') || s.includes('power bi'))) {
        targetJobTitle = 'Data Analyst';
      } else if (skills.some(s => s.includes('react') || s.includes('angular') || s.includes('vue'))) {
        targetJobTitle = 'Frontend Developer';
      } else if (skills.some(s => s.includes('node') || s.includes('express') || s.includes('django'))) {
        targetJobTitle = 'Backend Developer';
      } else if (skills.some(s => s.includes('python') || s.includes('machine learning') || s.includes('tensorflow'))) {
        targetJobTitle = 'Python Developer';
      } else if (skills.some(s => s.includes('java') && !s.includes('javascript'))) {
        targetJobTitle = 'Java Developer';
      } else {
        targetJobTitle = 'Software Developer';
      }
    }

    // ══════════════════════════════════════════════════════════════
    //  CLEAN RESUME SKILLS
    //  Filter out garbage tokens from parsed resume
    // ══════════════════════════════════════════════════════════════
    const rawSkills = resume.parsedData?.skills || [];
    const garbagePatterns = [
      /^additional\s*information/i, /^\d+/, /uploads\/min/i,
      /^worked\s*on/i, /^and\s/i, /^\W+$/, /^(the|a|an|to|in|of|for)$/i,
      /^[^a-zA-Z]*$/, /\.$/,
    ];
    const resumeSkills = rawSkills
      .map(s => typeof s === 'string' ? s.trim() : '')
      .filter(s => {
        if (s.length < 2 || s.length > 50) return false;
        return !garbagePatterns.some(p => p.test(s));
      });

    // Also extract clean skills from full resume text using the engine's TECH_SKILLS list
    const fullResumeText = [
      resume.parsedData?.summary || '',
      ...(resume.parsedData?.experience || []).map(e => `${e.title || ''} ${e.description || ''}`),
      ...(resume.parsedData?.education || []).map(e => `${e.degree || ''} ${e.field || ''}`),
      ...resumeSkills,
    ].join(' ');
    const cleanedSkillsFromText = extractSkillsFromResume(fullResumeText);
    // Merge: use cleaned skills from TECH_SKILLS + any valid parsed skills
    const mergedSkills = [...new Set([...cleanedSkillsFromText, ...resumeSkills.map(s => s.toLowerCase())])];

    const candidateName = resume.parsedData?.name || 'Candidate';
    const resumeSummary = resume.parsedData?.summary || '';
    const searchQuery = `${targetJobTitle} ${mergedSkills.slice(0, 5).join(' ')}`.trim();

    // Estimate experience years from resume
    const expEntries = resume.parsedData?.experience || [];
    const estimatedYears = Math.max(1, Math.min(expEntries.length * 2, 15));

    console.log(`📋 Candidate: ${candidateName}`);
    console.log(`📋 Target Job: ${targetJobTitle}`);
    console.log(`📋 Raw Skills (${rawSkills.length}): ${rawSkills.slice(0, 5).join(', ')}`);
    console.log(`📋 Cleaned Skills (${mergedSkills.length}): ${mergedSkills.slice(0, 10).join(', ')}`);
    console.log(`📋 Est. Experience: ~${estimatedYears} years`);
    console.log(`🌍 Step 1/2: Searching jobs from API platforms + scrapers...`);

    // STEP 1: Search jobs from FREE APIs (Remotive + Jobicy + Arbeitnow + USAJobs) AND scrapers
    let allJobs = [];
    
    // 1A: API-based job search (most reliable)
    try {
      const apiResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/api/search-jobs-api`,
        {
          query: targetJobTitle,
          location: location || '',
          max_per_platform: 10,
          platforms: ['remotive', 'themuse', 'arbeitnow', 'usajobs'],
        },
        { timeout: 30000 }
      );

      if (apiResponse.data.success) {
        const apiJobs = apiResponse.data.data?.jobs || [];
        allJobs.push(...apiJobs);
        console.log(`✅ API search: ${apiJobs.length} jobs from Remotive/Jobicy/Arbeitnow/USAJobs`);
      }
    } catch (apiErr) {
      console.warn(`⚠️ API search error: ${apiErr.message}`);
    }

    // 1B: Also try the HTTP scraper for local jobs (Rozee)
    try {
      const scrapingResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/api/scrape-jobs`,
        {
          jobTitle: targetJobTitle,
          keywords: searchQuery,
          location: location || 'Pakistan',
          platforms: ['rozee'],
          max_results_per_platform: 10
        },
        { timeout: 30000 }
      );

      if (scrapingResponse.data.success) {
        const scraperJobs = scrapingResponse.data.data?.jobs || [];
        allJobs.push(...scraperJobs);
        console.log(`✅ Scraper: ${scraperJobs.length} jobs from Rozee`);
      }
    } catch (scrapeErr) {
      console.warn(`⚠️ Scraping error: ${scrapeErr.message}`);
    }

    console.log(`✅ Found ${allJobs.length} total jobs from all platforms`);

    if (allJobs.length === 0) {
      return res.json({
        success: true,
        data: {
          resumeInfo: {
            id: resume._id,
            name: candidateName,
            targetRole: targetJobTitle,
            skills: mergedSkills,
            summary: resumeSummary
          },
          allMatchingJobs: [],
          jobsByPlatform: {},
          statistics: { totalJobsFound: 0, totalMatches: 0, byPlatform: {}, averageMatchScore: 0 },
          message: 'No jobs found from platforms. Try again later.'
        }
      });
    }

    // STEP 2: TF-IDF + Cosine Similarity matching (Node.js - no Python dependency)
    console.log(`🧠 Step 2/2: TF-IDF matching (Node.js recommendation engine)...`);

    let matchingJobs = [];

    try {
      const scored = matchScrapedJobs({
        resumeSkills: mergedSkills,  // Use cleaned skills instead of raw garbage
        resumeTitle: targetJobTitle,
        resumeSummary: fullResumeText,  // Use full resume text for better TF-IDF
        resumeExperienceYears: estimatedYears,
        jobs: allJobs,
        minScore: 10,  // Lower threshold — let frontend decide what to show
      });

      matchingJobs = scored.map((job, idx) => ({
        id: `${job.source || 'job'}-${Date.now()}-${idx}`,
        title: job.title || 'Untitled',
        company: job.company || 'Unknown Company',
        location: job.location || 'Pakistan',
        description: job.description || '',
        source: job.source || 'unknown',
        url: job.url || '#',
        matchScore: job.matchScore || 0,
        matchedSkills: job.matchedSkills || [],
        missingSkills: job.missingSkills || [],
        skillScore: job.skillScore || 0,
        semanticScore: job.semanticScore || 0,
        titleScore: job.titleScore || 0,
        experienceScore: job.experienceScore || 0,
        reason: job.reason || '',
        postedDate: job.posted_date || job.postedDate || 'Recently',
        easyApply: job.easy_apply || false,
      }));
      console.log(`✅ TF-IDF Matching complete: ${matchingJobs.length} jobs scored & ranked`);
    } catch (matchErr) {
      console.warn(`⚠️ TF-IDF matching error: ${matchErr.message}`);
      // Fallback: basic keyword matching
      console.log(`📊 Using basic keyword matching as fallback...`);
      for (const job of allJobs) {
        const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
        const matched = mergedSkills.filter(s => jobText.includes(s.toLowerCase()));
        const score = Math.min(100, 30 + matched.length * 12);
        matchingJobs.push({
          id: `${job.source || 'job'}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: job.title || 'Untitled',
          company: job.company || 'Unknown',
          location: job.location || 'Pakistan',
          description: job.description || '',
          source: job.source || 'unknown',
          url: job.url || '#',
          matchScore: score,
          matchedSkills: matched,
          missingSkills: [],
          postedDate: job.posted_date || 'Recently',
        });
      }
      matchingJobs.sort((a, b) => b.matchScore - a.matchScore);
    }

    // Save scraped jobs to DB for caching
    try {
      const ScrapedJob = (await import('../models/ScrapedJob.js')).default;
      for (const job of matchingJobs) {
        try {
          await ScrapedJob.findOneAndUpdate(
            { url: job.url },
            {
              $set: {
                title: job.title,
                company: job.company,
                location: job.location,
                description: job.description,
                source: job.source,
                url: job.url,
                postedDate: job.postedDate,
                scrapedAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
              $addToSet: {
                matches: {
                  resumeId: resume._id,
                  userId: req.user._id,
                  matchScore: job.matchScore,
                  matchedSkills: job.matchedSkills,
                  missingSkills: job.missingSkills,
                  matchedAt: new Date(),
                }
              }
            },
            { upsert: true, new: true }
          );
        } catch (saveErr) {
          // Ignore duplicate key errors
        }
      }
      console.log(`💾 Saved ${matchingJobs.length} jobs to database cache`);
    } catch (dbErr) {
      console.warn(`⚠️ DB cache save failed (non-critical): ${dbErr.message}`);
    }

    console.log(`\n✅ Resume Matching Complete`);
    console.log(`   Total Jobs Scraped: ${allJobs.length}`);
    console.log(`   Matching Jobs: ${matchingJobs.length}`);
    if (matchingJobs.length > 0) {
      console.log(`   Top Match: ${matchingJobs[0].title} (${matchingJobs[0].matchScore}%)`);
    }

    // Group by platform
    const jobsByPlatform = {};
    matchingJobs.forEach(job => {
      const key = job.source || 'other';
      if (!jobsByPlatform[key]) jobsByPlatform[key] = [];
      jobsByPlatform[key].push(job);
    });

    res.json({
      success: true,
      data: {
        resumeInfo: {
          id: resume._id,
          name: candidateName,
          targetRole: targetJobTitle,
          skills: resumeSkills,
          summary: resumeSummary
        },
        allMatchingJobs: matchingJobs,
        jobsByPlatform: jobsByPlatform,
        statistics: {
          totalJobsFound: allJobs.length,
          totalMatches: matchingJobs.length,
          byPlatform: Object.keys(jobsByPlatform).reduce((acc, key) => {
            acc[key] = jobsByPlatform[key].length;
            return acc;
          }, {}),
          averageMatchScore: matchingJobs.length > 0 
            ? Math.round(matchingJobs.reduce((sum, j) => sum + j.matchScore, 0) / matchingJobs.length)
            : 0,
          matchingTechnique: 'TF-IDF Vectorization + Cosine Similarity (Node.js natural)'
        }
      }
    });

  } catch (error) {
    console.error('🔴 Find matching jobs error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.warn('⚠️ Python service unavailable, returning empty results');
      return res.json({
        success: true,
        data: {
          allMatchingJobs: [],
          jobsByPlatform: {},
          statistics: { totalJobsFound: 0, totalMatches: 0, byPlatform: {}, averageMatchScore: 0 },
          error: 'Job scraping service is temporarily unavailable. Please try again later.'
        }
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || 'Unknown error'
    });
  }
});

// ============================================
// APPLICATION ROUTES (Job Seeker Apply)
// ============================================

/**
 * POST /api/jobs/:jobId/apply
 * Job seeker applies to a job — sends resume directly to HR
 */
router.post('/jobs/:jobId/apply', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { jobId } = req.params;
    const { coverNote } = req.body;

    // Find the job
    const job = await Job.findById(jobId).populate('postedBy', 'name email company');
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    if (job.status !== 'active') {
      return res.status(400).json({ success: false, error: 'This job is no longer accepting applications' });
    }

    // Get the job seeker's latest resume
    const resume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!resume) {
      return res.status(400).json({ success: false, error: 'Please upload your resume before applying' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ jobSeeker: userId, job: jobId });
    if (existingApplication) {
      return res.status(400).json({ success: false, error: 'You have already applied to this job' });
    }

    // Calculate match score
    const resumeSkills = (resume.parsedData?.skills || []).map(s => s.toLowerCase());
    const jobText = [
      job.title || '', job.description || '',
      ...(job.requirements || []), ...(job.skillsRequired || [])
    ].join(' ').toLowerCase();
    const matchedSkills = resumeSkills.filter(skill => jobText.includes(skill));
    const matchScore = resumeSkills.length > 0
      ? Math.round((matchedSkills.length / resumeSkills.length) * 100)
      : 0;

    // Create the application
    const application = new Application({
      jobSeeker: userId,
      job: jobId,
      resume: resume._id,
      hr: job.postedBy._id || job.postedBy,
      status: 'pending',
      matchScore,
      coverNote: coverNote || '',
      statusHistory: [{ status: 'pending', changedAt: new Date(), note: 'Application submitted' }]
    });

    await application.save();

    // Add resume to job's applicants array (for HR screening)
    if (!job.applicants) job.applicants = [];
    if (!job.applicants.includes(resume._id)) {
      job.applicants.push(resume._id);
      await job.save();
    }

    console.log(`[APPLY] User ${userId} applied to job ${jobId} (match: ${matchScore}%)`);

    res.json({
      success: true,
      data: application,
      message: 'Application submitted successfully! The HR team will review your resume.'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'You have already applied to this job' });
    }
    console.error('Apply error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/jobseeker/my-applications
 * Get all applications for the logged-in job seeker
 */
router.get('/jobseeker/my-applications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const applications = await Application.find({ jobSeeker: userId })
      .populate({
        path: 'job',
        select: 'title company location type salary experience status postedDate'
      })
      .populate('hr', 'name email company')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hr/applications
 * Get all applications received by this HR (their posted jobs)
 */
router.get('/hr/applications', authMiddleware, async (req, res) => {
  try {
    const hrId = req.user._id;

    const applications = await Application.find({ hr: hrId })
      .populate('jobSeeker', 'name email')
      .populate({
        path: 'job',
        select: 'title company location type'
      })
      .populate({
        path: 'resume',
        select: 'parsedData aiAnalysis decisionStatus'
      })
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Get HR applications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/hr/applications/:id/status
 * HR updates application status
 */
router.put('/hr/applications/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const hrId = req.user._id;

    const validStatuses = ['pending', 'reviewing', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const application = await Application.findOne({ _id: id, hr: hrId });
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    application.status = status;
    application.updatedAt = new Date();
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      note: note || `Status changed to ${status}`
    });

    if (note) application.hrNotes = note;

    await application.save();

    res.json({
      success: true,
      data: application,
      message: `Application status updated to ${status}`
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/jobs/:jobId/application-status
 * Check if job seeker has already applied to a job
 */
router.get('/jobs/:jobId/application-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { jobId } = req.params;

    const application = await Application.findOne({ jobSeeker: userId, job: jobId });

    res.json({
      success: true,
      applied: !!application,
      status: application?.status || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// COMPANIES ROUTE (Explore Companies)
// ============================================

/**
 * GET /api/companies
 * Get all HR companies with job counts
 */
router.get('/companies', authMiddleware, async (req, res) => {
  try {
    // Get all HR users
    const hrUsers = await User.find({ role: 'hr' }).select('name email company avatar');

    // Get job counts per HR
    const companies = await Promise.all(hrUsers.map(async (hr) => {
      const activeJobs = await Job.countDocuments({ postedBy: hr._id, status: 'active' });
      const totalJobs = await Job.countDocuments({ postedBy: hr._id });

      return {
        _id: hr._id,
        name: hr.name,
        email: hr.email,
        company: hr.company || 'Unknown Company',
        avatar: hr.avatar,
        activeJobs,
        totalJobs
      };
    }));

    // Group by company name
    const companyMap = {};
    companies.forEach(c => {
      const key = c.company;
      if (!companyMap[key]) {
        companyMap[key] = {
          company: key,
          recruiters: [],
          activeJobs: 0,
          totalJobs: 0,
          email: c.email,
          avatar: c.avatar
        };
      }
      companyMap[key].recruiters.push({ name: c.name, email: c.email, _id: c._id });
      companyMap[key].activeJobs += c.activeJobs;
      companyMap[key].totalJobs += c.totalJobs;
    });

    res.json({
      success: true,
      data: Object.values(companyMap)
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN DASHBOARD ROUTES (Live Data)
// ============================================

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const jobSeekers = await User.countDocuments({ role: 'jobseeker' });
    const hrRecruiters = await User.countDocuments({ role: 'hr' });
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const flaggedFromReports = await AnomalyReport.countDocuments({ status: { $in: ['flagged', 'pending', 'Flagged'] } });
    const flaggedFromResumes = await Resume.countDocuments({ 'anomalyDetection.hasAnomalies': true });
    const flaggedResumes = flaggedFromReports > 0 ? flaggedFromReports : flaggedFromResumes;
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    const totalApplications = await Application.countDocuments();
    const totalResumes = await Resume.countDocuments();

    // Calculate percentages
    const seekerPercent = totalUsers > 0 ? Math.round((jobSeekers / totalUsers) * 100) : 0;
    const hrPercent = totalUsers > 0 ? Math.round((hrRecruiters / totalUsers) * 100) : 0;

    // Get premium revenue estimate  
    const premiumRevenue = premiumUsers * 29;

    res.json({
      success: true,
      data: {
        totalUsers,
        jobSeekers,
        hrRecruiters,
        premiumUsers,
        flaggedResumes,
        totalJobs,
        activeJobs,
        totalApplications,
        totalResumes,
        seekerPercent,
        hrPercent,
        premiumRevenue
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/user-growth
 * Get user growth data for charts
 */
router.get('/admin/user-growth', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const weeks = [];
    
    for (let i = 5; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);
      
      const count = await User.countDocuments({
        createdAt: { $lte: weekEnd }
      });
      
      weeks.push({
        name: `Week ${6 - i}`,
        users: count
      });
    }

    res.json({ success: true, data: weeks });
  } catch (error) {
    console.error('User growth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/recent-users
 * Get recently registered users
 */
router.get('/admin/recent-users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select('name email role isPremium createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedUsers = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role === 'hr' ? 'HR' : u.role === 'admin' ? 'Admin' : 'Job Seeker',
      status: 'Active',
      joined: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : 'N/A',
      isPremium: u.isPremium || false
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('Recent users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/anomaly-reports
 * Get recent anomaly reports
 */
router.get('/admin/anomaly-reports', authMiddleware, async (req, res) => {
  try {
    // Primary: AnomalyReport collection
    const reports = await AnomalyReport.find()
      .populate('resume', 'originalFile parsedData')
      .sort({ createdAt: -1 })
      .limit(10);

    let formatted = reports.map(r => ({
      _id: r._id,
      resume: r.resume?.originalFile || r.resume?.parsedData?.name || 'Unknown',
      score: r.riskScore || 0,
      status: r.status || 'Flagged',
      reason: (r.indicators && r.indicators.length > 0) ? r.indicators[0] : 'Suspicious content',
      priority: r.priority || 'medium',
      createdAt: r.createdAt
    }));

    // Fallback: pull from Resume.anomalyDetection if no dedicated reports
    if (formatted.length === 0) {
      const flaggedResumes = await Resume.find({
        'anomalyDetection.hasAnomalies': true
      })
        .populate('user', 'name email')
        .sort({ 'anomalyDetection.detectedAt': -1 })
        .limit(10);

      formatted = flaggedResumes.map(r => ({
        _id: r._id,
        resume: r.parsedData?.name || r.originalFile || 'Unknown',
        score: r.anomalyDetection?.anomalyCount
          ? Math.min(100, r.anomalyDetection.anomalyCount * 15 + 30)
          : 50,
        status: r.anomalyDetection?.severity === 'high' ? 'Flagged' : 'Pending',
        reason: r.anomalyDetection?.issues?.[0]?.message
          || (r.anomalyDetection?.issues?.[0]?.type || 'Anomaly detected'),
        priority: r.anomalyDetection?.severity || 'medium',
        createdAt: r.anomalyDetection?.detectedAt || r.createdAt
      }));
    }

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Anomaly reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/ai-usage
 * Get AI usage statistics
 */
router.get('/admin/ai-usage', authMiddleware, async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments();
    const analyzedResumes = await Resume.countDocuments({ aiAnalysis: { $exists: true, $ne: null } });
    const matchCount = await Match.countDocuments();
    const anomalyCount = await AnomalyReport.countDocuments();
    
    const total = analyzedResumes + matchCount + anomalyCount || 1;
    
    const data = [
      { name: 'Resume Analysis', value: Math.round((analyzedResumes / total) * 100) || 65 },
      { name: 'Job Matching', value: Math.round((matchCount / total) * 100) || 25 },
      { name: 'Anomaly Detection', value: Math.round((anomalyCount / total) * 100) || 10 }
    ];

    res.json({ success: true, data });
  } catch (error) {
    console.error('AI usage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Admin deletes a user
 */
router.delete('/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    // Also delete user's resumes and applications
    await Resume.deleteMany({ user: id });
    await Application.deleteMany({ jobSeeker: id });
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN - ALL USERS (with search & filter)
// ============================================
router.get('/admin/users', authMiddleware, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('name email role company isPremium premiumExpiresAt createdAt isEmailVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formatted = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      roleLabel: u.role === 'hr' ? 'HR' : u.role === 'admin' ? 'Admin' : 'Job Seeker',
      company: u.company || '',
      isPremium: u.isPremium || false,
      isEmailVerified: u.isEmailVerified || false,
      joined: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : 'N/A',
      createdAt: u.createdAt
    }));

    res.json({ success: true, data: formatted, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN - ALL JOBS
// ============================================
router.get('/admin/jobs', authMiddleware, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { location: searchRegex }
      ];
    }

    const total = await Job.countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formatted = jobs.map(j => ({
      _id: j._id,
      title: j.title,
      company: j.company,
      location: j.location || 'N/A',
      type: j.type || 'Full-time',
      status: j.status || 'active',
      salary: j.salary || '',
      experience: j.experience || '',
      applications: 0,
      postedBy: j.postedBy ? { name: j.postedBy.name, email: j.postedBy.email } : null,
      createdAt: j.createdAt,
      posted: j.createdAt ? new Date(j.createdAt).toISOString().split('T')[0] : 'N/A'
    }));

    // Get application counts
    for (const job of formatted) {
      job.applications = await Application.countDocuments({ job: job._id });
    }

    res.json({ success: true, data: formatted, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Admin jobs list error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN - ALL ANOMALY REPORTS (full)
// ============================================
router.get('/admin/anomaly-reports-full', authMiddleware, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    // 1. Try AnomalyReport collection first
    const total = await AnomalyReport.countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reports = await AnomalyReport.find(filter)
      .populate('resume', 'originalFile parsedData user')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    let formatted = reports.map(r => ({
      _id: r._id,
      resumeName: r.resume?.originalFile || r.resume?.parsedData?.name || 'Unknown',
      userName: r.user?.name || r.resume?.parsedData?.name || 'Unknown',
      userEmail: r.user?.email || 'N/A',
      riskScore: r.riskScore || 0,
      status: r.status || 'flagged',
      indicators: r.indicators || [],
      priority: r.priority || 'medium',
      createdAt: r.createdAt,
      date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'N/A'
    }));

    // 2. Fallback: pull from Resume.anomalyDetection if no dedicated reports
    let totalCount = total;
    if (formatted.length === 0) {
      const resumeFilter = { 'anomalyDetection.hasAnomalies': true };
      if (status && status !== 'all') {
        // Map statuses
        if (status === 'flagged') resumeFilter['anomalyDetection.severity'] = { $in: ['high', 'medium'] };
        if (status === 'pending') resumeFilter['anomalyDetection.severity'] = 'low';
      }
      totalCount = await Resume.countDocuments(resumeFilter);
      const flaggedResumes = await Resume.find(resumeFilter)
        .populate('user', 'name email')
        .sort({ 'anomalyDetection.detectedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit));

      formatted = flaggedResumes.map(r => {
        const anomaly = r.anomalyDetection || {};
        const indicators = (anomaly.issues || []).map(i => i.message || i.type || 'Unknown issue');
        const riskScore = anomaly.anomalyCount
          ? Math.min(100, anomaly.anomalyCount * 15 + 30)
          : (anomaly.severity === 'high' ? 75 : anomaly.severity === 'medium' ? 50 : 30);
        const detectedAt = anomaly.detectedAt || r.createdAt;

        // Apply search filter
        if (search) {
          const q = search.toLowerCase();
          const nameMatch = (r.parsedData?.name || '').toLowerCase().includes(q);
          const emailMatch = (r.user?.email || '').toLowerCase().includes(q);
          if (!nameMatch && !emailMatch) return null;
        }

        return {
          _id: r._id,
          resumeName: r.parsedData?.name || r.originalFile || 'Unknown',
          userName: r.user?.name || r.parsedData?.name || 'Unknown',
          userEmail: r.user?.email || r.parsedData?.email || 'N/A',
          riskScore,
          status: anomaly.severity === 'high' ? 'flagged' : 'pending',
          indicators: indicators.length > 0 ? indicators : ['Anomaly detected in resume data'],
          priority: anomaly.severity || 'medium',
          createdAt: detectedAt,
          date: detectedAt ? new Date(detectedAt).toISOString().split('T')[0] : 'N/A'
        };
      }).filter(Boolean);
    } else if (search) {
      // Apply search to AnomalyReport results
      const q = search.toLowerCase();
      formatted = formatted.filter(r =>
        r.resumeName.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: formatted, total: totalCount, page: parseInt(page), pages: Math.ceil(totalCount / parseInt(limit)) });
  } catch (error) {
    console.error('Anomaly reports full error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN - LOGS
// ============================================
router.get('/admin/logs', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const total = await AdminLog.countDocuments();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AdminLog.find()
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formatted = logs.map(l => ({
      _id: l._id,
      action: l.action,
      category: l.category,
      details: l.details,
      performedBy: l.performedBy ? { name: l.performedBy.name, email: l.performedBy.email } : null,
      createdAt: l.createdAt,
      date: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : 'N/A'
    }));

    res.json({ success: true, data: formatted, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN - TOGGLE JOB STATUS
// ============================================
router.patch('/admin/jobs/:id/toggle-status', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    job.status = job.status === 'active' ? 'closed' : 'active';
    await job.save();

    res.json({ success: true, data: { _id: job._id, status: job.status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN - DELETE JOB
// ============================================
router.delete('/admin/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    await Application.deleteMany({ job: req.params.id });
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ENHANCED RESUME - Generate with Groq AI
// ============================================
router.post('/jobseeker/enhance-resume', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.body;
    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const parsedData = resume.parsedData || {};
    const analysis = resume.aiAnalysis || {};
    const name = parsedData.name || 'Candidate';
    const email = parsedData.email || '';
    const phone = parsedData.phone || '';
    const skills = parsedData.skills || [];
    const experience = parsedData.experience || [];
    const education = parsedData.education || [];
    const summary = parsedData.summary || analysis.summary || '';
    const rawText = resume.rawText || resume.extractedText || '';

    // Build resume context for AI
    const resumeContext = `
Name: ${name}
Email: ${email}
Phone: ${phone}
Skills: ${skills.join(', ')}
Summary: ${summary}
Experience: ${JSON.stringify(experience)}
Education: ${JSON.stringify(education)}
Full Resume Text: ${rawText.slice(0, 3000)}
Current ATS Score: ${analysis.atsScore || analysis.ats_score || 'N/A'}
Current Grammar Score: ${analysis.grammarScore || analysis.grammar_score || 'N/A'}
Current Readability: ${analysis.readability || analysis.readability_score || 'N/A'}
Current Structure Score: ${analysis.structureScore || analysis.structure_score || 'N/A'}
Weaknesses Found: ${(analysis.weaknesses || []).join('; ')}
`;

    const prompt = `You are an expert resume writer. Enhance and improve the following resume to maximize its ATS score, fix all grammar issues, improve readability, and strengthen the structure.

RESUME DATA:
${resumeContext}

Please return a JSON response with the following structure (no markdown, just pure JSON):
{
  "enhancedSummary": "A powerful 2-3 sentence professional summary",
  "enhancedSkills": ["skill1", "skill2", ...],
  "enhancedExperience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Date Range",
      "bullets": ["Achievement-focused bullet point 1", "bullet 2", ...]
    }
  ],
  "enhancedEducation": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "year": "Year"
    }
  ],
  "grammarFixes": ["List of grammar corrections made"],
  "structureImprovements": ["List of structure improvements"],
  "atsKeywordsAdded": ["Keywords added to improve ATS"],
  "estimatedNewScore": 85
}

RULES:
- Use strong action verbs (Led, Developed, Implemented, Achieved)
- Add quantifiable metrics where possible
- Fix all grammar and spelling errors
- Use standard section headers for ATS
- Keep it professional and concise
- Ensure consistent tense (past for previous, present for current roles)
- Add relevant industry keywords`;

    let enhancedData = null;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Try Groq first (faster)
    if (GROQ_API_KEY) {
      try {
        const groqResponse = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const content = groqResponse.data.choices?.[0]?.message?.content;
        if (content) {
          enhancedData = JSON.parse(content);
        }
      } catch (groqErr) {
        console.warn('Groq API failed, trying Gemini:', groqErr.message);
      }
    }

    // Fallback to Gemini
    if (!enhancedData && GEMINI_API_KEY) {
      try {
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
          },
          { timeout: 30000 }
        );

        let content = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          // Strip markdown code fences if present
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          enhancedData = JSON.parse(content);
        }
      } catch (geminiErr) {
        console.warn('Gemini API also failed:', geminiErr.message);
      }
    }

    if (!enhancedData) {
      return res.status(500).json({ success: false, error: 'AI service unavailable. Please try again later.' });
    }

    res.json({
      success: true,
      data: {
        original: { name, email, phone, skills, experience, education, summary },
        enhanced: enhancedData
      }
    });
  } catch (error) {
    console.error('Enhanced resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

