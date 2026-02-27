# -*- coding: utf-8 -*-
"""
VeriResume - Deep Resume Analyzer
Provides detailed scoring for Grammar, Structure, Readability, ATS compatibility,
and extracts recommended keywords from the resume.
"""

import re
import math
import logging
from typing import Dict, List, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
#  Skill / Keyword database
# ------------------------------------------------------------------ #
TECH_SKILLS = {
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go",
    "rust", "swift", "kotlin", "php", "scala", "r", "matlab", "perl",
    "react", "angular", "vue", "next.js", "node.js", "express", "django",
    "flask", "spring", "spring boot", ".net", "laravel", "rails",
    "html", "css", "sass", "tailwind", "bootstrap",
    "sql", "mysql", "postgresql", "mongodb", "redis", "firebase",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "git", "github", "gitlab", "ci/cd", "jenkins", "devops",
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "data science", "data analysis", "data engineering", "big data",
    "rest api", "graphql", "microservices", "agile", "scrum",
    "linux", "unix", "bash", "powershell",
    "figma", "photoshop", "illustrator", "ui/ux",
    "jira", "confluence", "trello", "slack",
    "selenium", "cypress", "jest", "pytest", "junit",
    "blockchain", "web3", "solidity", "ethereum",
    "power bi", "tableau", "excel", "sap", "oracle",
}

SOFT_SKILLS = {
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "time management", "project management",
    "mentoring", "presentation", "negotiation", "collaboration",
    "adaptability", "creativity", "attention to detail", "analytical",
    "strategic thinking", "decision making", "conflict resolution",
}

ACTION_VERBS = {
    "achieved", "managed", "developed", "implemented", "designed",
    "led", "created", "built", "delivered", "optimized", "improved",
    "launched", "coordinated", "analyzed", "spearheaded", "streamlined",
    "increased", "reduced", "negotiated", "mentored", "trained",
    "automated", "integrated", "architected", "resolved", "executed",
    "established", "generated", "transformed", "collaborated",
}

SECTION_KEYWORDS = {
    "education": ["education", "academic", "degree", "university", "college",
                  "bachelor", "master", "phd", "diploma", "certification"],
    "experience": ["experience", "employment", "work history", "professional",
                   "career", "position", "role", "job"],
    "skills": ["skills", "technical skills", "competencies", "proficiency",
               "expertise", "technologies", "tools"],
    "contact": ["email", "phone", "address", "linkedin", "github", "portfolio"],
    "summary": ["summary", "objective", "profile", "about me", "overview"],
    "projects": ["projects", "portfolio", "achievements", "accomplishments"],
    "certifications": ["certifications", "licenses", "credentials", "awards"],
}


class DeepResumeAnalyzer:
    """Deeply analyzes a resume and returns grammar, structure,
       readability, ATS scores and recommended keywords."""

    def analyze(self, resume_text: str, job_description: str = "") -> Dict:
        """
        Run all analysis and return a single result dict.

        Returns:
            {
                grammar_score, structure_score, readability_score, ats_score,
                overall_score, extracted_skills, recommended_keywords,
                matched_skills, missing_skills, weaknesses, suggestions,
                section_analysis, metrics
            }
        """
        if not resume_text or len(resume_text.strip()) < 30:
            return self._empty_result("Resume text too short for analysis")

        text = resume_text.strip()
        lower = text.lower()

        # --- individual analyses ---
        grammar   = self._score_grammar(text)
        structure = self._score_structure(text, lower)
        readability = self._score_readability(text)
        skills_info = self._extract_skills(lower)
        ats       = self._score_ats(text, lower, skills_info, structure, job_description)
        keywords  = self._recommend_keywords(skills_info, job_description)
        job_match = self._match_job(skills_info, job_description)

        overall = round(
            ats["score"] * 0.35
            + grammar["score"] * 0.20
            + readability["score"] * 0.20
            + structure["score"] * 0.25,
            1,
        )

        weaknesses  = grammar["issues"] + structure["issues"] + readability["issues"] + ats["issues"]
        suggestions = grammar["suggestions"] + structure["suggestions"] + readability["suggestions"] + ats["suggestions"]

        return {
            "grammar_score": grammar["score"],
            "structure_score": structure["score"],
            "readability_score": readability["score"],
            "ats_score": ats["score"],
            "overall_score": overall,
            "extracted_skills": skills_info["all"],
            "tech_skills": skills_info["tech"],
            "soft_skills": skills_info["soft"],
            "recommended_keywords": keywords,
            "matched_skills": job_match["matched"],
            "missing_skills": job_match["missing"],
            "weaknesses": weaknesses[:10],
            "suggestions": suggestions[:10],
            "section_analysis": structure["sections"],
            "metrics": {
                "word_count": len(text.split()),
                "sentence_count": grammar["sentence_count"],
                "action_verbs_used": grammar["action_verb_count"],
                "bullet_points": structure["bullet_count"],
                "sections_found": structure["section_count"],
                "skill_count": len(skills_info["all"]),
            },
        }

    # ================================================================ #
    #  GRAMMAR
    # ================================================================ #
    def _score_grammar(self, text: str) -> Dict:
        score = 85  # start optimistic
        issues: List[str] = []
        suggestions: List[str] = []

        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 5]
        sentence_count = len(sentences)

        # 1. Sentence length distribution
        long_sentences = [s for s in sentences if len(s.split()) > 35]
        if long_sentences:
            penalty = min(len(long_sentences) * 3, 15)
            score -= penalty
            issues.append(f"{len(long_sentences)} overly long sentences (>35 words)")
            suggestions.append("Break long sentences into shorter, clearer ones")

        short_fragments = [s for s in sentences if len(s.split()) < 3 and not s.isupper()]
        if len(short_fragments) > 3:
            score -= 5
            issues.append(f"{len(short_fragments)} very short fragments detected")

        # 2. Repeated words (within same sentence)
        repeated = 0
        for s in sentences:
            words = s.lower().split()
            for w in set(words):
                if len(w) > 4 and words.count(w) > 2:
                    repeated += 1
        if repeated > 3:
            score -= min(repeated * 2, 10)
            issues.append(f"Repetitive wording detected ({repeated} instances)")
            suggestions.append("Vary vocabulary to make the resume more engaging")

        # 3. Action verbs bonus
        text_lower = text.lower()
        action_count = sum(1 for v in ACTION_VERBS if v in text_lower)
        if action_count >= 8:
            score += 5
        elif action_count < 3:
            score -= 5
            issues.append("Very few action verbs used")
            suggestions.append("Start bullet points with action verbs like 'Developed', 'Led', 'Implemented'")

        # 4. Spelling-like heuristics (common typos / informal)
        informal = re.findall(r'\b(gonna|wanna|gotta|stuff|things|etc\.?)\b', text_lower)
        if informal:
            score -= len(informal) * 2
            issues.append("Informal language detected")
            suggestions.append("Replace informal words with professional alternatives")

        # 5. Consistent tense (past tense verbs ending in -ed vs present gerunds)
        past = len(re.findall(r'\b\w+ed\b', text_lower))
        present = len(re.findall(r'\b\w+ing\b', text_lower))
        if past > 0 and present > 0:
            ratio = min(past, present) / max(past, present)
            if ratio > 0.6:
                score -= 3
                issues.append("Mixed verb tenses detected")
                suggestions.append("Use consistent tense - past tense for previous roles, present for current")

        score = max(min(score, 100), 20)
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "sentence_count": sentence_count,
            "action_verb_count": action_count,
        }

    # ================================================================ #
    #  STRUCTURE
    # ================================================================ #
    def _score_structure(self, text: str, lower: str) -> Dict:
        score = 70
        issues: List[str] = []
        suggestions: List[str] = []
        sections_found: Dict[str, bool] = {}

        # Check which sections exist
        for section, keywords in SECTION_KEYWORDS.items():
            found = any(kw in lower for kw in keywords)
            sections_found[section] = found

        present = [k for k, v in sections_found.items() if v]
        missing = [k for k, v in sections_found.items() if not v]
        section_count = len(present)

        # Core sections
        core = ["contact", "experience", "education", "skills"]
        core_present = sum(1 for c in core if sections_found.get(c, False))
        score += core_present * 5  # +5 per core section  (max +20)
        core_missing = [c for c in core if not sections_found.get(c, False)]
        if core_missing:
            issues.append(f"Missing core sections: {', '.join(core_missing)}")
            suggestions.append(f"Add sections for: {', '.join(core_missing)}")

        # Bonus sections
        bonus = ["summary", "projects", "certifications"]
        bonus_present = sum(1 for b in bonus if sections_found.get(b, False))
        score += bonus_present * 3

        # Bullet points
        bullets = len(re.findall(r'^\s*[-*\u2022\u25cf]\s', text, re.MULTILINE))
        if bullets >= 5:
            score += 5
        elif bullets == 0:
            score -= 5
            issues.append("No bullet points found")
            suggestions.append("Use bullet points to list achievements and responsibilities")

        # Length check
        word_count = len(text.split())
        if word_count < 150:
            score -= 10
            issues.append(f"Resume is too short ({word_count} words)")
            suggestions.append("Aim for 400-800 words to provide sufficient detail")
        elif word_count > 1200:
            score -= 5
            issues.append(f"Resume may be too long ({word_count} words)")
            suggestions.append("Keep resume concise, ideally 1-2 pages")

        score = max(min(score, 100), 20)
        return {
            "score": score,
            "issues": issues,
            "suggestions": suggestions,
            "sections": sections_found,
            "section_count": section_count,
            "bullet_count": bullets,
        }

    # ================================================================ #
    #  READABILITY
    # ================================================================ #
    def _score_readability(self, text: str) -> Dict:
        score = 80
        issues: List[str] = []
        suggestions: List[str] = []

        words = text.split()
        word_count = len(words)
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 5]
        sentence_count = max(len(sentences), 1)

        # Average sentence length
        avg_sentence_len = word_count / sentence_count
        if avg_sentence_len > 25:
            score -= 8
            issues.append(f"Average sentence length too high ({avg_sentence_len:.0f} words)")
            suggestions.append("Shorten sentences for better readability")
        elif avg_sentence_len < 8:
            score -= 3

        # Complex words (>3 syllables approximation)
        def syllable_count(w):
            w = w.lower().rstrip("es").rstrip("e")
            return max(1, len(re.findall(r'[aeiouy]+', w)))

        complex_words = sum(1 for w in words if syllable_count(w) >= 4)
        complex_ratio = complex_words / max(word_count, 1)
        if complex_ratio > 0.15:
            score -= 7
            issues.append("Too many complex words detected")
            suggestions.append("Use simpler, more direct language where possible")
        elif complex_ratio < 0.05:
            score += 3  # good readability

        # Paragraph density (no blank-line separation)
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        if len(paragraphs) <= 1 and word_count > 200:
            score -= 5
            issues.append("Text appears as a single block")
            suggestions.append("Break content into clear paragraphs and sections")

        # Vocabulary diversity
        unique_words = len(set(w.lower() for w in words if len(w) > 3))
        diversity = unique_words / max(word_count, 1)
        if diversity > 0.55:
            score += 5  # rich vocabulary
        elif diversity < 0.3:
            score -= 5
            issues.append("Low vocabulary diversity")
            suggestions.append("Use varied language to make your resume more engaging")

        score = max(min(score, 100), 20)
        return {"score": score, "issues": issues, "suggestions": suggestions}

    # ================================================================ #
    #  ATS SCORE
    # ================================================================ #
    def _score_ats(
        self, text: str, lower: str, skills_info: Dict, structure: Dict,
        job_description: str
    ) -> Dict:
        score = 60
        issues: List[str] = []
        suggestions: List[str] = []

        # 1. Skills density
        skill_count = len(skills_info["all"])
        if skill_count >= 10:
            score += 15
        elif skill_count >= 5:
            score += 10
        elif skill_count >= 3:
            score += 5
        else:
            issues.append(f"Only {skill_count} skills detected")
            suggestions.append("Add more relevant technical skills to your resume")

        # 2. Contact information
        has_email = bool(re.search(r'[\w.+-]+@[\w-]+\.[\w.]+', text))
        has_phone = bool(re.search(r'[\+]?[\d\s()-]{7,15}', text))
        has_linkedin = "linkedin" in lower
        if has_email:
            score += 5
        else:
            issues.append("No email address found")
            suggestions.append("Add your email address at the top of your resume")
        if has_phone:
            score += 3
        if has_linkedin:
            score += 2

        # 3. Section completeness
        sections = structure.get("sections", {})
        core_present = sum(1 for s in ["contact", "experience", "education", "skills"] if sections.get(s))
        score += core_present * 3

        # 4. Keyword match to job description
        if job_description and len(job_description) > 20:
            jd_lower = job_description.lower()
            jd_words = set(re.findall(r'\b[a-z]{3,}\b', jd_lower))
            resume_words = set(re.findall(r'\b[a-z]{3,}\b', lower))
            overlap = jd_words & resume_words
            if len(jd_words) > 0:
                match_pct = len(overlap) / len(jd_words) * 100
                if match_pct > 60:
                    score += 10
                elif match_pct > 40:
                    score += 5

        # 5. Formatting (ATS-hostile patterns)
        if re.search(r'[│║╔╗╚╝═─┌┐└┘]', text):
            score -= 5
            issues.append("Special box-drawing characters detected (ATS unfriendly)")
            suggestions.append("Use simple formatting, avoid tables and text boxes")

        if len(re.findall(r'\t', text)) > 10:
            score -= 3
            issues.append("Excessive tabs detected")

        score = max(min(score, 100), 20)
        return {"score": score, "issues": issues, "suggestions": suggestions}

    # ================================================================ #
    #  SKILLS EXTRACTION
    # ================================================================ #
    def _extract_skills(self, lower: str) -> Dict:
        # Use word-boundary matching to avoid false positives
        # (e.g., "r" matching inside "experienced", "go" inside "google",
        #  "java" inside "javascript", "scala" inside "scalable")
        SUBSTR_CONFLICTS = {"java", "scala", "r", "go", "c#", "c++", "ruby", "rust", "swift", "sass"}
        tech = []
        for s in TECH_SKILLS:
            if s in SUBSTR_CONFLICTS or len(s) <= 3:
                # Strict word-boundary match
                pattern = r'(?<![a-zA-Z/])' + re.escape(s) + r'(?![a-zA-Z])'
                if re.search(pattern, lower):
                    tech.append(s)
            else:
                if s in lower:
                    tech.append(s)
        tech = sorted(set(tech))
        soft = sorted(s for s in SOFT_SKILLS if s in lower)
        return {"tech": tech, "soft": soft, "all": tech + soft}

    # ================================================================ #
    #  KEYWORD RECOMMENDATIONS
    # ================================================================ #
    def _recommend_keywords(self, skills_info: Dict, job_description: str) -> List[str]:
        """Return keywords the candidate should highlight or add."""
        found = set(s.lower() for s in skills_info["all"])
        recommendations: List[str] = []

        # If there is a job description, suggest missing JD keywords
        if job_description and len(job_description) > 20:
            jd_lower = job_description.lower()
            for skill in TECH_SKILLS | SOFT_SKILLS:
                if skill in jd_lower and skill not in found:
                    recommendations.append(skill)

        # Always return the skills already in the resume as "recommended keywords"
        # (the user wants to see which keywords are extracted from their resume)
        resume_keywords = list(skills_info["all"])

        # Deduplicate and limit
        all_recs = resume_keywords + [r for r in recommendations if r not in resume_keywords]
        return all_recs[:20]

    # ================================================================ #
    #  JOB MATCHING
    # ================================================================ #
    def _match_job(self, skills_info: Dict, job_description: str) -> Dict:
        if not job_description or len(job_description) < 20:
            return {"matched": skills_info["all"], "missing": [], "score": 0}

        jd_lower = job_description.lower()
        matched = [s for s in skills_info["all"] if s in jd_lower]
        jd_skills = [s for s in TECH_SKILLS | SOFT_SKILLS if s in jd_lower]
        missing = [s for s in jd_skills if s not in skills_info["all"]]
        return {"matched": matched, "missing": missing[:10], "score": len(matched)}

    # ================================================================ #
    #  Empty result helper
    # ================================================================ #
    def _empty_result(self, reason: str) -> Dict:
        return {
            "grammar_score": 0, "structure_score": 0,
            "readability_score": 0, "ats_score": 0, "overall_score": 0,
            "extracted_skills": [], "tech_skills": [], "soft_skills": [],
            "recommended_keywords": [], "matched_skills": [], "missing_skills": [],
            "weaknesses": [reason], "suggestions": [],
            "section_analysis": {}, "metrics": {},
        }
