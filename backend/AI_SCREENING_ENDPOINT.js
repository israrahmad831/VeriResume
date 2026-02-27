/**
 * POST /api/hr/run-ai-screening
 * Add this endpoint to backend/routes/api.js AFTER the upload-resumes endpoint
 */

router.post('/hr/run-ai-screening', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { jobDescription } = req.body;

    // Get resumes that haven't been processed yet (atsScore = 0)
    const resumes = await Resume.find({
      user: userId,
      'aiAnalysis.atsScore': 0
    });

    if (resumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No pending resumes found. All resumes have been processed.'
      });
    }

    console.log(`\n🤖 Running AI Screening on ${resumes.length} resume(s)...`);

    const processedResumes = [];
    const errors = [];

    // Process each resume
    for (const resume of resumes) {
      try {
        const filePath = path.join(__dirname, '../../uploads', resume.originalFile);

        if (!fs.existsSync(filePath)) {
          console.log(`   ⚠️ File not found: ${resume.originalFile}`);
          errors.push({
            resumeId: resume._id,
            fileName: resume.originalFile,
            error: 'File not found'
          });
          continue;
        }

        console.log(`\n📄 Processing: ${resume.originalFile}`);

        // Step 1: Parse resume
        const formData = new FormData();
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream, resume.originalFile);

        const parseResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/parse-resume`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        });

        if (!parseResponse.data.success) {
          throw new Error('Failed to parse resume');
        }

        const parsedData = parseResponse.data.data;
        console.log(`   ✅ Parsed: ${parsedData.name || 'Unknown'}`);

        // Step 2: AI Analysis
        const analyzeResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/analyze-resume`, {
          resumeText: parsedData.raw_text || '',
          jobDescription: jobDescription || ''
        }, {
          timeout: 60000,
        });

        const aiAnalysis = analyzeResponse.data.success ? analyzeResponse.data.data : {};
        console.log(`   ✅ Analyzed - ATS: ${aiAnalysis.ats_score || 0}%`);

        // Step 3: Anomaly Detection
        const anomalyResponse = await axios.post(`${PYTHON_SERVICE_URL}/api/detect-anomalies`, {
          resumeText: parsedData.raw_text || '',
          parsedData: parsedData
        }, {
          timeout: 30000,
        });

        const anomalyReport = anomalyResponse.data.success ? anomalyResponse.data.data : {};
        console.log(`   ✅ Anomaly Check - Risk: ${anomalyReport.risk_level || 'Unknown'}`);

        // Update resume
        resume.parsedData = {
          name: parsedData.name || '',
          email: parsedData.email || '',
          phone: parsedData.phone || '',
          education: parsedData.education || [],
          experience: parsedData.experience || [],
          skills: parsedData.skills || [],
          summary: parsedData.summary || parsedData.raw_text || '',
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
              anomalyScore: anomalyReport.anomaly_score || 0,
              indicators: anomalyReport.issues || [],
              status: 'pending',
              priority: anomalyReport.risk_level === 'High' ? 'high' : 'medium'
            });
            await newAnomalyReport.save();
            console.log(`   ⚠️ Anomaly report created - ${anomalyReport.risk_level} risk`);
          }
        }

        processedResumes.push({
          id: resume._id,
          name: parsedData.name,
          email: parsedData.email,
          atsScore: aiAnalysis.ats_score || 0,
          anomalyRisk: anomalyReport.risk_level || 'Low',
          skills: parsedData.skills?.slice(0, 5) || []
        });

      } catch (processError) {
        console.error(`   ❌ Error processing ${resume.originalFile}:`, processError.message);
        errors.push({
          resumeId: resume._id,
          fileName: resume.originalFile,
          error: processError.message
        });
      }
    }

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
    console.error('AI Screening error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run AI screening'
    });
  }
});
