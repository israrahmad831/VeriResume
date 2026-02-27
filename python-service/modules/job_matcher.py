# -*- coding: utf-8 -*-
"""
VeriResume - Intelligent Job Matching Engine
Uses NLP and semantic similarity to match resumes with job listings.

Techniques:
  - Skill-based matching (Jaccard + weighted overlap)
  - Semantic similarity using TF-IDF + Cosine Similarity (scikit-learn)
  - Job title relevance scoring
  - Experience level matching
  - Composite weighted scoring
"""

import re
import logging
from typing import List, Dict, Optional, Set
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

# TF-IDF based semantic matching (lightweight, no GPU required)
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np

    _tfidf_vectorizer = TfidfVectorizer(
        stop_words='english',
        max_features=5000,
        ngram_range=(1, 2),  # unigrams + bigrams for better context
    )
    HAS_SEMANTIC = True
    logger.info("[JobMatcher] TF-IDF semantic matching available")
except ImportError:
    HAS_SEMANTIC = False
    logger.warning("[JobMatcher] scikit-learn not available, using keyword matching only")

# ─────────────────────────────────────────────────────────────────────
#  Common skill aliases / normalization
# ─────────────────────────────────────────────────────────────────────
SKILL_ALIASES = {
    "js": "javascript", "ts": "typescript", "py": "python",
    "react.js": "react", "reactjs": "react", "react js": "react",
    "node.js": "node", "nodejs": "node", "node js": "node",
    "vue.js": "vue", "vuejs": "vue",
    "next.js": "nextjs", "next js": "nextjs",
    "c#": "csharp", "c sharp": "csharp",
    "c++": "cpp", "cplusplus": "cpp",
    ".net": "dotnet", "dot net": "dotnet",
    "mongo": "mongodb", "mongo db": "mongodb",
    "postgres": "postgresql", "pg": "postgresql",
    "ms sql": "mssql", "sql server": "mssql",
    "amazon web services": "aws",
    "google cloud platform": "gcp", "google cloud": "gcp",
    "ml": "machine learning", "dl": "deep learning",
    "ai": "artificial intelligence",
    "ci/cd": "cicd", "ci cd": "cicd",
    "devops": "devops", "dev ops": "devops",
    "ui/ux": "uiux", "ui ux": "uiux",
    "power bi": "powerbi",
    "ms office": "microsoft office",
    "ms excel": "excel",
}

# High-value tech skills (weighted higher in matching)
HIGH_VALUE_SKILLS = {
    "python", "javascript", "react", "node", "typescript", "java", "csharp",
    "aws", "azure", "gcp", "docker", "kubernetes", "sql", "mongodb",
    "machine learning", "deep learning", "tensorflow", "pytorch",
    "flutter", "swift", "kotlin", "golang", "rust",
    "graphql", "rest api", "microservices", "cicd",
    "postgresql", "redis", "elasticsearch",
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill name for consistent comparison."""
    s = skill.strip().lower()
    return SKILL_ALIASES.get(s, s)


def extract_skills_from_text(text: str) -> Set[str]:
    """Extract potential skill keywords from free text (job descriptions)."""
    if not text:
        return set()

    text_lower = text.lower()
    found: Set[str] = set()

    # Check for known skills / aliases
    all_known = set(SKILL_ALIASES.values()) | HIGH_VALUE_SKILLS | set(SKILL_ALIASES.keys())
    for skill in all_known:
        # Word boundary match to avoid partial matches
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.add(normalize_skill(skill))

    return found


class JobMatcher:
    """
    Matches a parsed resume against a list of scraped jobs.

    Scoring weights (total = 100):
        Skill overlap:        40%
        Semantic similarity:  30%
        Title relevance:      20%
        Experience match:     10%
    """

    WEIGHT_SKILLS   = 0.40
    WEIGHT_SEMANTIC = 0.30
    WEIGHT_TITLE    = 0.20
    WEIGHT_EXP      = 0.10

    def __init__(self):
        logger.info("[JobMatcher] Initialized")

    # ─────────────────────────────────────────────────────────────────
    #  Public API
    # ─────────────────────────────────────────────────────────────────
    def match_resume_to_jobs(
        self,
        resume_skills: List[str],
        resume_title: str,
        resume_summary: str,
        resume_experience_years: int,
        jobs: List[Dict],
        min_score: int = 30,
    ) -> List[Dict]:
        """
        Score and rank a list of jobs against a resume.

        Returns list of dicts sorted by matchScore (descending),
        each containing the original job data plus:
            matchScore, matchedSkills, missingSkills,
            skillScore, semanticScore, titleScore, experienceScore
        """
        if not jobs:
            return []

        norm_resume_skills = {normalize_skill(s) for s in resume_skills if s}
        resume_title_lower = (resume_title or "").lower().strip()
        resume_text = f"{resume_title} {resume_summary} {' '.join(resume_skills)}"

        results: List[Dict] = []

        for job in jobs:
            try:
                scored = self._score_single_job(
                    job=job,
                    norm_resume_skills=norm_resume_skills,
                    resume_title_lower=resume_title_lower,
                    resume_text=resume_text,
                    resume_experience_years=resume_experience_years,
                )
                if scored["matchScore"] >= min_score:
                    results.append(scored)
            except Exception as e:
                logger.warning(f"[JobMatcher] Error scoring job '{job.get('title', '?')}': {e}")
                continue

        # Sort by match score descending
        results.sort(key=lambda x: x["matchScore"], reverse=True)
        logger.info(f"[JobMatcher] Matched {len(results)}/{len(jobs)} jobs (>= {min_score}%)")
        return results

    # ─────────────────────────────────────────────────────────────────
    #  Internal scoring
    # ─────────────────────────────────────────────────────────────────
    def _score_single_job(
        self,
        job: Dict,
        norm_resume_skills: Set[str],
        resume_title_lower: str,
        resume_text: str,
        resume_experience_years: int,
    ) -> Dict:
        """Compute composite score for one job."""

        job_title = (job.get("title") or "").strip()
        job_desc = (job.get("description") or "").strip()
        job_text = f"{job_title} {job_desc}"

        # 1. Skill matching ──────────────────────
        job_skills = extract_skills_from_text(job_text)
        if not job_skills:
            # Fallback: treat words in title as pseudo-skills
            job_skills = {normalize_skill(w) for w in job_title.lower().split() if len(w) > 2}

        matched = norm_resume_skills & job_skills
        missing = job_skills - norm_resume_skills
        # Weighted overlap: high-value matches count more
        high_matched = matched & HIGH_VALUE_SKILLS
        regular_matched = matched - HIGH_VALUE_SKILLS
        weighted_matches = len(high_matched) * 1.5 + len(regular_matched)
        total_possible = max(len(job_skills), 1)
        skill_score = min(100, (weighted_matches / total_possible) * 100)

        # 2. Semantic similarity (TF-IDF + Cosine) ──────────────────
        semantic_score = 50  # neutral default
        if HAS_SEMANTIC and resume_text.strip() and job_text.strip():
            try:
                tfidf_matrix = _tfidf_vectorizer.fit_transform([resume_text, job_text])
                sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
                # TF-IDF cosine typically 0-0.5 range, scale to 0-100
                semantic_score = max(0, min(100, sim * 200))
            except Exception:
                pass

        # 3. Title relevance ──────────────────────
        title_score = self._title_relevance(resume_title_lower, job_title.lower())

        # 4. Experience match ─────────────────────
        exp_score = self._experience_match(resume_experience_years, job_text)

        # Composite score
        composite = (
            skill_score   * self.WEIGHT_SKILLS
            + semantic_score * self.WEIGHT_SEMANTIC
            + title_score   * self.WEIGHT_TITLE
            + exp_score     * self.WEIGHT_EXP
        )
        final_score = int(round(min(100, max(0, composite))))

        return {
            **job,  # Keep all original job fields
            "matchScore": final_score,
            "matchedSkills": sorted(matched),
            "missingSkills": sorted(missing),
            "skillScore": int(round(skill_score)),
            "semanticScore": int(round(semantic_score)),
            "titleScore": int(round(title_score)),
            "experienceScore": int(round(exp_score)),
        }

    def _title_relevance(self, resume_title: str, job_title: str) -> float:
        """Score 0-100 for how relevant the job title is to the resume target role."""
        if not resume_title or not job_title:
            return 50

        # Exact or near-exact match
        ratio = SequenceMatcher(None, resume_title, job_title).ratio()
        if ratio > 0.8:
            return 95

        # Check if resume title words appear in job title
        resume_words = set(resume_title.split()) - {"a", "an", "the", "and", "or", "of", "in", "at", "for"}
        job_words = set(job_title.split()) - {"a", "an", "the", "and", "or", "of", "in", "at", "for"}

        if not resume_words:
            return 50

        overlap = len(resume_words & job_words) / len(resume_words)
        # Scale: 0 overlap -> 20, full overlap -> 95
        return 20 + overlap * 75

    def _experience_match(self, resume_years: int, job_text: str) -> float:
        """Estimate how well experience level matches."""
        # Try to extract required years from job text
        patterns = [
            r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)',
            r'(?:experience|exp).*?(\d+)\+?\s*(?:years?|yrs?)',
            r'(\d+)\s*-\s*\d+\s*(?:years?|yrs?)',
        ]
        required_years = 0
        job_lower = job_text.lower()
        for pattern in patterns:
            m = re.search(pattern, job_lower)
            if m:
                required_years = int(m.group(1))
                break

        if required_years == 0:
            # Can't determine — assume neutral
            return 70

        if resume_years >= required_years:
            return 95
        elif resume_years >= required_years - 1:
            return 75
        else:
            # Under-qualified
            ratio = resume_years / max(required_years, 1)
            return max(20, ratio * 70)


# Singleton for import
job_matcher = JobMatcher()
