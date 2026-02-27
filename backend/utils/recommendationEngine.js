/**
 * AI Job Recommendation Engine
 * Uses TF-IDF vectorization and cosine similarity for CV-job matching
 */

import natural from 'natural';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * Extract searchable text from a job seeker's profile
 * @param {Object} profile - The user's profile
 * @param {Object} user - The user object
 * @param {string} resumeText - Optional parsed resume text
 */
export const extractProfileText = (profile, user, resumeText = '') => {
    const textParts = [];

    // Add parsed resume text (high priority - this contains all CV data)
    if (resumeText && resumeText.trim()) {
        // Repeat resume text for emphasis since it's the primary source
        textParts.push(resumeText.toLowerCase());
        textParts.push(resumeText.toLowerCase());
    }

    // Add skills (high weight - repeat for emphasis)
    if (profile?.skills && Array.isArray(profile.skills)) {
        profile.skills.forEach(skill => {
            if (skill.name) {
                // Repeat skill based on level for weighting
                const weight = skill.level === 'expert' ? 4 :
                    skill.level === 'advanced' ? 3 :
                        skill.level === 'intermediate' ? 2 : 1;
                for (let i = 0; i < weight; i++) {
                    textParts.push(skill.name.toLowerCase());
                }
            }
        });
    }

    // Add experience titles and descriptions
    if (profile?.experience && Array.isArray(profile.experience)) {
        profile.experience.forEach(exp => {
            if (exp.title) textParts.push(exp.title.toLowerCase());
            if (exp.description) textParts.push(exp.description.toLowerCase());
        });
    }

    // Add about/summary
    if (profile?.about) {
        textParts.push(profile.about.toLowerCase());
    }

    // Add education fields
    if (profile?.education && Array.isArray(profile.education)) {
        profile.education.forEach(edu => {
            if (edu.field) textParts.push(edu.field.toLowerCase());
            if (edu.degree) textParts.push(edu.degree.toLowerCase());
        });
    }

    // Add user name for context
    if (user?.name) {
        textParts.push(user.name.toLowerCase());
    }

    return textParts.join(' ');
};

/**
 * Extract searchable text from a job listing
 */
export const extractJobText = (job) => {
    const textParts = [];

    // Add title (high weight - repeat for emphasis)
    if (job.title) {
        for (let i = 0; i < 3; i++) {
            textParts.push(job.title.toLowerCase());
        }
    }

    // Add skills (high weight)
    if (job.skills && Array.isArray(job.skills)) {
        job.skills.forEach(skill => {
            for (let i = 0; i < 3; i++) {
                textParts.push(skill.toLowerCase());
            }
        });
    }

    // Also handle skillsRequired (from HR-posted jobs)
    if (job.skillsRequired && Array.isArray(job.skillsRequired)) {
        job.skillsRequired.forEach(skill => {
            for (let i = 0; i < 3; i++) {
                textParts.push(skill.toLowerCase());
            }
        });
    }

    // Add description
    if (job.description) {
        textParts.push(job.description.toLowerCase());
    }

    // Add requirements
    if (job.requirements && Array.isArray(job.requirements)) {
        job.requirements.forEach(req => {
            textParts.push(req.toLowerCase());
        });
    }

    // Add company name
    if (job.company) {
        textParts.push(job.company.toLowerCase());
    }

    // Add job type
    if (job.type || job.jobType) {
        textParts.push((job.type || job.jobType).toLowerCase());
    }

    return textParts.join(' ');
};

/**
 * Calculate experience level from profile
 * Returns years of experience estimate
 */
const calculateExperienceYears = (profile) => {
    if (!profile?.experience || !Array.isArray(profile.experience)) {
        return 0;
    }

    let totalMonths = 0;

    profile.experience.forEach(exp => {
        if (exp.startDate) {
            const start = new Date(exp.startDate);
            const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
            const months = (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth());
            totalMonths += months;
        }
    });

    return Math.round(totalMonths / 12);
};

/**
 * Parse experience requirement from job
 */
const parseExperienceRequirement = (experience) => {
    if (!experience) return 0;

    const exp = experience.toLowerCase();

    // Match patterns like "3+ years", "1-2 years", "entry level", etc.
    if (exp.includes('entry') || exp.includes('fresher') || exp.includes('junior')) {
        return 0;
    }

    const match = exp.match(/(\d+)/);
    if (match) {
        return parseInt(match[1]);
    }

    if (exp.includes('senior') || exp.includes('lead')) {
        return 5;
    }

    if (exp.includes('mid')) {
        return 2;
    }

    return 0;
};

/**
 * Calculate cosine similarity between two TF-IDF vectors
 */
const cosineSimilarity = (tfidf, doc1Index, doc2Index) => {
    const terms1 = {};
    const terms2 = {};

    tfidf.listTerms(doc1Index).forEach(item => {
        terms1[item.term] = item.tfidf;
    });

    tfidf.listTerms(doc2Index).forEach(item => {
        terms2[item.term] = item.tfidf;
    });

    // Get all unique terms
    const allTerms = new Set([...Object.keys(terms1), ...Object.keys(terms2)]);

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    allTerms.forEach(term => {
        const val1 = terms1[term] || 0;
        const val2 = terms2[term] || 0;

        dotProduct += val1 * val2;
        magnitude1 += val1 * val1;
        magnitude2 += val2 * val2;
    });

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
        return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Common tech skills to look for in resume
 */
const TECH_SKILLS = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
    'react', 'reactjs', 'angular', 'vue', 'vuejs', 'svelte', 'node', 'nodejs', 'express', 'django', 'flask', 'spring', 'laravel', 'rails',
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind', 'tailwindcss', 'bootstrap', 'jquery', 'material-ui', 'mui',
    'mongodb', 'mysql', 'postgresql', 'postgres', 'redis', 'elasticsearch', 'firebase', 'sqlite', 'oracle', 'sql server', 'mariadb',
    'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'jenkins', 'git', 'github', 'gitlab', 'bitbucket',
    'machine learning', 'ml', 'deep learning', 'dl', 'artificial intelligence', 'ai', 'data science', 'data analysis', 'nlp', 'computer vision',
    'data visualization', 'data cleaning', 'data engineering', 'data mining', 'data modeling', 'data warehouse',
    'tableau', 'power bi', 'powerbi', 'looker', 'metabase', 'qlik', 'd3.js', 'd3',
    'etl', 'data pipeline', 'airflow', 'spark', 'hadoop', 'hive', 'kafka', 'databricks', 'snowflake', 'bigquery',
    'statistics', 'statistical analysis', 'r', 'spss', 'stata', 'sas', 'matlab',
    'agile', 'scrum', 'jira', 'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
    'rest', 'restful', 'rest api', 'graphql', 'microservices', 'devops', 'ci/cd', 'cicd',
    'linux', 'unix', 'windows', 'macos', 'android', 'ios', 'mobile', 'flutter', 'react native',
    'sql', 'nosql', 'orm', 'api', 'frontend', 'front-end', 'backend', 'back-end', 'fullstack', 'full-stack', 'full stack',
    'nextjs', 'next.js', 'nuxt', 'nuxtjs', 'gatsby', 'webpack', 'vite', 'babel', 'npm', 'yarn', 'pnpm',
    'tensorflow', 'pytorch', 'keras', 'pandas', 'numpy', 'scikit-learn', 'scipy', 'matplotlib', 'seaborn', 'plotly',
    'jupyter', 'notebook', 'colab', 'anaconda',
    'testing', 'jest', 'mocha', 'cypress', 'selenium', 'unit testing', 'integration testing',
    'communication', 'leadership', 'teamwork', 'problem solving', 'analytical', 'project management',
    'excel', 'powerpoint', 'word', 'office', 'sap', 'salesforce', 'crm',
    'blockchain', 'ethereum', 'solidity', 'web3', 'smart contracts',
    'security', 'cybersecurity', 'penetration testing', 'network security'
];

/**
 * Extract skills from resume text
 */
export const extractSkillsFromResume = (resumeText) => {
    if (!resumeText || typeof resumeText !== 'string') {
        return [];
    }

    const text = resumeText.toLowerCase();
    const foundSkills = [];

    TECH_SKILLS.forEach(skill => {
        // Create pattern to match the skill as a word
        const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (pattern.test(text)) {
            foundSkills.push(skill);
        }
    });

    return [...new Set(foundSkills)]; // Remove duplicates
};

/**
 * Calculate skill match percentage (enhanced to use resume skills)
 */
const calculateSkillMatch = (profileSkills, jobSkills, resumeText = '') => {
    if (!jobSkills || jobSkills.length === 0) {
        return { score: 0, matched: [], missing: [] };
    }

    // Get skills from profile
    let allUserSkills = [];

    if (profileSkills && Array.isArray(profileSkills)) {
        allUserSkills = profileSkills.map(s =>
            (typeof s === 'string' ? s : s.name || '').toLowerCase()
        ).filter(s => s);
    }

    // Extract skills from resume text
    if (resumeText) {
        const resumeSkills = extractSkillsFromResume(resumeText);
        allUserSkills = [...new Set([...allUserSkills, ...resumeSkills])];
    }

    if (allUserSkills.length === 0) {
        return { score: 0, matched: [], missing: jobSkills };
    }

    const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

    const matched = [];
    const missing = [];

    jobSkillsLower.forEach(jobSkill => {
        if (allUserSkills.some(ps =>
            ps.includes(jobSkill) || jobSkill.includes(ps)
        )) {
            matched.push(jobSkill);
        } else {
            missing.push(jobSkill);
        }
    });

    const score = (matched.length / jobSkillsLower.length) * 100;

    return { score, matched, missing };
};

/**
 * Generate match reason based on analysis
 */
const generateReason = (job, profile, skillMatch, experienceMatch, tfidfScore, resumeText = '') => {
    const reasons = [];

    // Skill matching reason
    if (skillMatch >= 80) {
        reasons.push('Excellent skill match');
    } else if (skillMatch >= 50) {
        reasons.push('Good skill alignment');
    } else if (skillMatch > 0) {
        reasons.push('Some relevant skills');
    }

    // Get all user skills (profile + resume)
    let allUserSkills = [];

    if (profile?.skills && Array.isArray(profile.skills)) {
        allUserSkills = profile.skills.map(s =>
            (typeof s === 'string' ? s : s.name || '').toLowerCase()
        ).filter(s => s);
    }

    // Add skills from resume
    if (resumeText) {
        const resumeSkills = extractSkillsFromResume(resumeText);
        allUserSkills = [...new Set([...allUserSkills, ...resumeSkills])];
    }

    // Find specific matching skills from both profile and resume
    const jobSkills = job.skills || job.skillsRequired || [];
    if (jobSkills.length > 0 && allUserSkills.length > 0) {
        const matchingSkills = jobSkills.filter(js =>
            allUserSkills.some(ps => ps.includes(js.toLowerCase()) || js.toLowerCase().includes(ps))
        );
        if (matchingSkills.length > 0) {
            reasons.push(`Matches: ${matchingSkills.slice(0, 4).join(', ')}`);
        }
    }

    // Experience reason
    if (experienceMatch) {
        reasons.push('Experience level suitable');
    }

    // Job type
    if (job.type || job.jobType) {
        reasons.push(`${job.type || job.jobType} position`);
    }

    return reasons.length > 0 ? reasons.join('. ') : 'Based on resume and profile analysis';
};

/**
 * Score scraped jobs against resume data using TF-IDF + skill matching
 * This replaces the Python matching endpoint.
 *
 * @param {Object} params
 * @param {string[]} params.resumeSkills - Skills from parsed resume
 * @param {string} params.resumeTitle - Target job title
 * @param {string} params.resumeSummary - Resume summary text
 * @param {number} params.resumeExperienceYears - Estimated experience
 * @param {Object[]} params.jobs - Scraped jobs to score
 * @param {number} params.minScore - Minimum match score (default 25)
 * @returns {Object[]} Scored and ranked jobs
 */
export const matchScrapedJobs = ({
    resumeSkills = [],
    resumeTitle = '',
    resumeSummary = '',
    resumeExperienceYears = 0,
    jobs = [],
    minScore = 25,
}) => {
    if (!jobs || jobs.length === 0) return [];

    // Build a pseudo-profile for the candidate from resume data
    const profile = {
        skills: resumeSkills.map(s => ({ name: s, level: 'intermediate' })),
        about: resumeSummary,
    };
    const user = { name: resumeTitle };

    // Build resume text from all available data
    const resumeText = [resumeTitle, resumeSummary, ...resumeSkills].join(' ');

    // ── TF-IDF calculation ──────────────────────────────────────
    const tfidf = new TfIdf();

    // Document 0 = resume/profile
    const profileText = extractProfileText(profile, user, resumeText);
    tfidf.addDocument(profileText);

    // Documents 1..N = jobs
    jobs.forEach(job => {
        const jobText = extractJobText(job);
        tfidf.addDocument(jobText);
    });

    // ── Score each job ──────────────────────────────────────────
    const scoredJobs = jobs.map((job, index) => {
        // 1. TF-IDF cosine similarity (profile=doc0, job=doc index+1)
        const tfidfScore = cosineSimilarity(tfidf, 0, index + 1);

        // 2. Skill match (uses both profile skills and resume text extraction)
        const jobSkills = job.skills || job.skillsRequired || [];
        // For scraped jobs, extract skills from description to create synthetic skill list
        let effectiveJobSkills = jobSkills;
        if (effectiveJobSkills.length === 0 && job.description) {
            effectiveJobSkills = extractSkillsFromResume(
                `${job.title || ''} ${job.description || ''}`
            );
        }
        const skillResult = calculateSkillMatch(
            resumeSkills.map(s => s),  // plain string array
            effectiveJobSkills,
            resumeText
        );

        // 3. Experience match
        const requiredExp = parseExperienceRequirement(
            job.experience || job.description || ''
        );
        const experienceMatch = resumeExperienceYears >= requiredExp;
        const experiencePenalty = experienceMatch
            ? 0
            : Math.min((requiredExp - resumeExperienceYears) * 5, 30);

        // ── Combined score (weighted) ───
        // TF-IDF: 40%  |  Skill Match: 45%  |  Experience: 15%
        let combinedScore =
            (tfidfScore * 100 * 0.40) +
            (skillResult.score * 0.45) +
            (experienceMatch ? 15 : 0) -
            experiencePenalty;

        combinedScore = Math.max(0, Math.min(100, combinedScore));

        // Individual sub-scores for frontend breakdown
        const skillScore = Math.round(skillResult.score);
        const semanticScore = Math.round(tfidfScore * 100);
        const titleRelevance = computeTitleRelevance(resumeTitle, job.title || '');
        const experienceScore = experienceMatch ? 95 : Math.max(20, Math.round((resumeExperienceYears / Math.max(requiredExp, 1)) * 70));

        const reason = generateReason(job, profile, skillResult.score, experienceMatch, tfidfScore, resumeText);

        return {
            ...job,
            matchScore: Math.round(combinedScore),
            matchedSkills: skillResult.matched,
            missingSkills: skillResult.missing,
            skillScore,
            semanticScore,
            titleScore: titleRelevance,
            experienceScore,
            reason,
        };
    });

    // Filter by min score and sort descending
    return scoredJobs
        .filter(j => j.matchScore >= minScore)
        .sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Compute title relevance between resume target role and job title
 */
function computeTitleRelevance(resumeTitle, jobTitle) {
    if (!resumeTitle || !jobTitle) return 50;
    const rt = resumeTitle.toLowerCase().trim();
    const jt = jobTitle.toLowerCase().trim();

    // Exact match
    if (rt === jt) return 100;

    // Word overlap
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'at', 'for', 'to', '-', '/', '|']);
    const resumeWords = rt.split(/\s+/).filter(w => !stopWords.has(w) && w.length > 1);
    const jobWords = jt.split(/\s+/).filter(w => !stopWords.has(w) && w.length > 1);

    if (resumeWords.length === 0) return 50;

    const overlap = resumeWords.filter(rw => jobWords.some(jw => jw.includes(rw) || rw.includes(jw))).length;
    const ratio = overlap / resumeWords.length;

    return Math.round(20 + ratio * 75);
}

/**
 * Main recommendation function for HR-posted jobs
 * Returns top N jobs ranked by relevance
 * @param {Object} profile - User's profile
 * @param {Object} user - User object
 * @param {Array} jobs - Array of job listings
 * @param {number} limit - Maximum recommendations to return
 * @param {string} resumeText - Optional parsed resume text
 */
export const getRecommendations = (profile, user, jobs, limit = 5, resumeText = '') => {
    if (!jobs || jobs.length === 0) {
        return [];
    }

    const tfidf = new TfIdf();

    // Extract profile text (including resume if available) and add as first document
    const profileText = extractProfileText(profile, user, resumeText);
    tfidf.addDocument(profileText);

    // Add all job texts
    jobs.forEach(job => {
        const jobText = extractJobText(job);
        tfidf.addDocument(jobText);
    });

    // Calculate user's experience level
    const userExperience = calculateExperienceYears(profile);

    // Calculate scores for each job
    const scoredJobs = jobs.map((job, index) => {
        // TF-IDF similarity score (profile is doc 0, jobs start at doc 1)
        const tfidfScore = cosineSimilarity(tfidf, 0, index + 1);

        // Skill match score (now includes resume-extracted skills)
        const skillResult = calculateSkillMatch(profile?.skills, job.skills || job.skillsRequired || [], resumeText);

        // Experience compatibility
        const requiredExp = parseExperienceRequirement(job.experience);
        const experienceMatch = userExperience >= requiredExp;
        const experiencePenalty = experienceMatch ? 0 : Math.min((requiredExp - userExperience) * 5, 30);

        // Combined score (weighted)
        // TF-IDF: 40%, Skill Match: 45%, Experience: 15%
        let combinedScore = (tfidfScore * 100 * 0.40) +
            (skillResult.score * 0.45) +
            (experienceMatch ? 15 : 0) -
            experiencePenalty;

        // Normalize to 0-100
        combinedScore = Math.max(0, Math.min(100, combinedScore));

        // Generate human-readable reason (now includes resume skills)
        const reason = generateReason(job, profile, skillResult.score, experienceMatch, tfidfScore, resumeText);

        return {
            job_id: job._id,
            job_title: job.title,
            company: job.company,
            location: job.location,
            type: job.type || job.jobType,
            skills: job.skills || job.skillsRequired || [],
            match_score: Math.round(combinedScore),
            matchedSkills: skillResult.matched,
            missingSkills: skillResult.missing,
            reason,
            _original: job // Keep original job data
        };
    });

    // Filter out jobs with very low scores and sort by score
    const filteredJobs = scoredJobs
        .filter(j => j.match_score > 10) // Minimum threshold
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, limit);

    return filteredJobs;
};

export default {
    extractProfileText,
    extractJobText,
    extractSkillsFromResume,
    matchScrapedJobs,
    getRecommendations
};
