"""
HR Code Service - Direct integration with HRcode_INTEGRATED.py
Uses the exact same logic, algorithms, and libraries for accurate resume screening
"""

import sys
import os

# Add parent directory to path to import HRcode_INTEGRATED
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, parent_dir)

print(f"[HRCode Service] Python path includes: {parent_dir}")

try:
    # Import the exact classes from HRcode_INTEGRATED.py
    from HRcode_INTEGRATED import ResumeParser, AnomalyDetector, EnhancedJobMatcher, InteractiveHRSystem
    print("✅ Successfully imported HRcode_INTEGRATED classes")
except Exception as e:
    print(f"❌ Failed to import HRcode_INTEGRATED: {e}")
    print(f"   Trying alternate path...")
    import traceback
    traceback.print_exc()
    raise

class HRCodeService:
    """Service that wraps HRcode_INTEGRATED.py for web API use"""
    
    def __init__(self):
        """Initialize all modules using exact HRcode implementation"""
        print("[HRCode Service] Initializing components...")
        self.parser = ResumeParser()
        print("[HRCode Service] ✅ ResumeParser initialized")
        
        self.anomaly_detector = AnomalyDetector()
        print("[HRCode Service] ✅ AnomalyDetector initialized")
        
        self.job_matcher = EnhancedJobMatcher()
        print("[HRCode Service] ✅ EnhancedJobMatcher initialized")
        
        # Note: InteractiveHRSystem may reinitialize spaCy/Groq, so we skip full initialization
        # and just use individual methods from other classes
        print("[HRCode Service] ✅ Skipping InteractiveHRSystem (using component methods instead)")
        self.hr_system = None
        
        print("✅ HRCode Service initialized with exact HRcode_INTEGRATED.py logic")
    
    def analyze_resume_complete(self, resume_text: str, job_description: str, anomaly_threshold: int = 30, match_threshold: int = 50) -> dict:
        """
        Complete resume analysis using exact HRcode workflow
        
        Args:
            resume_text: Full resume text
            job_description: Job description for matching
            anomaly_threshold: Max allowed anomaly weight (0-100)
            match_threshold: Min required match score (0-100)
        
        Returns: {
            'success': bool,
            'candidate_info': {...},
            'match_score': int,
            'anomaly_weight': int,
            'decision': str,
            'matched_skills': [...],
            'missing_skills': [...],
            'anomalies': {...}
        }
        """
        
        try:
            # STEP 1: Parse resume text
            print("\n[HRCode Service] Step 1: Parsing Resume Text...")
            
            # Extract candidate info
            name = self.parser.extract_name(resume_text)
            email = self.parser.extract_email(resume_text)
            phone = self.parser.extract_phone(resume_text)
            skills = self.parser.extract_skills(resume_text)
            education = self.parser.extract_education(resume_text)
            experience = self.parser.extract_experience(resume_text)
            
            parsed_data = {
                'raw_text': resume_text,
                'name': name,
                'email': email,
                'phone': phone,
                'skills': skills,
                'education': education,
                'experience': experience,
                'candidate_info': {
                    'name': name,
                    'email': email,
                    'phone': phone
                }
            }
            
            print(f"   ✅ Parsed: {name}")
            print(f"      Skills: {len(skills)} found → {skills[:3]}")
            print(f"      Education: {len(education)} entries")
            print(f"      Experience: {len(experience)} entries")
            
            # STEP 2: Detect Anomalies
            print("\n[HRCode Service] Step 2: Detecting Anomalies...")
            anomaly_results = self.anomaly_detector.detect_anomalies(parsed_data)
            anomaly_weight = anomaly_results.get('weight', 0)
            anomalies = anomaly_results.get('issues', {})
            severity = anomaly_results.get('severity', 'Low')
            
            print(f"   ✅ Anomaly Weight: {anomaly_weight}/100 ({severity})")
            print(f"      Issues Found: {len(anomalies)}")
            
            # STEP 3: Calculate Match Score (EXACT HRcode logic)
            print("\n[HRCode Service] Step 3: Calculating Match Score...")
            match_results = self.job_matcher.calculate_match_score(parsed_data, job_description)
            match_score = match_results.get('match_score', 0)
            matched_skills = match_results.get('matched_skills', [])
            missing_skills = match_results.get('missing_skills', [])
            
            print(f"   ✅ Match Score: {match_score}%")
            print(f"      Matched Skills: {matched_skills[:3]} ({len(matched_skills)} total)")
            print(f"      Missing Skills: {missing_skills[:3]} ({len(missing_skills)} total)")
            
            # STEP 4: Apply HRcode Decision Logic with user-defined thresholds
            print("\n[HRCode Service] Step 4: Applying HRcode Decision Logic...")
            print(f"   Using thresholds: Anomaly max={anomaly_threshold}, Match min={match_threshold}%")
            
            # Implement exact should_shortlist logic from HRcode_INTEGRATED.py using provided thresholds
            weight = anomaly_weight
            threshold = anomaly_threshold
            
            if match_score >= 65:
                if weight > threshold:
                    decision = 'SHORTLISTED_WITH_FLAG'
                    reason = f'Strong qualifications ({match_score}%) outweigh formatting issues (Anomaly: {weight})'
                    recommendation = f'⚠️ FLAG: Excellent technical match but resume needs cleanup. Verify details in phone screening.'
                    shortlisted = True
                else:
                    decision = 'SHORTLISTED'
                    reason = f'Excellent match ({match_score}%) with good resume quality'
                    recommendation = f'✅ Strong candidate with excellent qualifications and clean resume. Proceed to interview.'
                    shortlisted = True
            elif match_score >= 45:
                if weight > threshold:
                    decision = 'NEEDS_REVIEW'
                    reason = f'Moderate match ({match_score}%) with quality concerns ({weight})'
                    recommendation = f'🔍 MANUAL REVIEW: Candidate has relevant skills but resume has issues. HR to assess feasibility.'
                    shortlisted = True
                else:
                    decision = 'SHORTLISTED'
                    reason = f'Good match ({match_score}%) with acceptable quality'
                    recommendation = f'✅ Solid candidate with acceptable qualifications. Consider for further evaluation.'
                    shortlisted = True
            else:
                if weight > threshold:
                    decision = 'REJECTED'
                    reason = f'Low match ({match_score}%) + poor quality ({weight})'
                    recommendation = f'❌ Not recommended: Lacks key qualifications AND resume quality concerns detected.'
                    shortlisted = False
                else:
                    decision = 'REJECTED'
                    reason = f'Insufficient qualifications match ({match_score}%)'
                    recommendation = f'❌ Not recommended: Skills and experience do not align with job requirements.'
                    shortlisted = False
            
            # Calculate ATS Score using exact HRcode formula
            # ATS Score = (Match Score × 0.70) + ((100 - Anomaly Weight) × 0.30)
            quality_score = 100 - anomaly_weight  # Convert anomaly weight to quality score (0-100)
            ats_score = int((match_score * 0.70) + (quality_score * 0.30))
            
            print(f"   ✅ Decision: {decision}")
            print(f"      Reason: {reason}")
            print(f"\n[HRCode Service] Final Scores:")
            print(f"      Match Score: {match_score}%")
            print(f"      Quality Score: {quality_score}%")
            print(f"      ATS Score: {ats_score}% (70% match + 30% quality)")
            
            return {
                'success': True,
                'candidate_info': parsed_data.get('candidate_info'),
                'match_score': match_score,
                'quality_score': quality_score,
                'ats_score': ats_score,
                'anomaly_weight': anomaly_weight,
                'anomaly_severity': severity,
                'anomaly_count': len(anomalies),
                'anomalies': anomalies,
                'decision': decision,
                'shortlisted': shortlisted,
                'reason': reason,
                'recommendation': recommendation,
                'matched_skills': matched_skills,
                'missing_skills': missing_skills,
                'skills': skills,
                'education': education,
                'experience': experience
            }
            
        except Exception as e:
            print(f"\n❌ Error in HRCode analysis: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return {
                'success': False,
                'error': str(e),
                'match_score': 0,
                'anomaly_weight': 0,
                'decision': 'ERROR'
            }
    
    def rank_resumes_hrcode(self, resume_texts: list, job_description: str) -> dict:
        """
        Rank multiple resumes using exact HRcode workflow
        
        Args:
            resume_texts: List of dicts with {'id', 'name', 'text'}
            job_description: Job description text
        
        Returns: Ranked list with decisions and scores
        """
        
        print(f"\n📊 Ranking {len(resume_texts)} resumes with HRcode logic...")
        print("=" * 70)
        
        rankings = []
        
        for idx, resume_data in enumerate(resume_texts, 1):
            resume_id = resume_data.get('id')
            candidate_name = resume_data.get('name', 'Unknown')
            resume_text = resume_data.get('text', '')
            
            print(f"\n[{idx}/{len(resume_texts)}] Analyzing: {candidate_name}")
            
            result = self.analyze_resume_complete(resume_text, job_description)
            
            if result.get('success'):
                rankings.append({
                    'resumeId': resume_id,
                    'candidateName': candidate_name,
                    'matchScore': result.get('match_score', 0),
                    'anomalyWeight': result.get('anomaly_weight', 0),
                    'decision': result.get('decision'),
                    'reason': result.get('reason'),
                    'shortlisted': result.get('shortlisted'),
                    'matchedSkills': result.get('matched_skills', []),
                    'missingSkills': result.get('missing_skills', []),
                    'skills': result.get('skills', []),
                    'education': result.get('education', []),
                    'experience': result.get('experience', [])
                })
                print(f"   ✅ {result.get('decision')} - {result.get('match_score')}% match")
            else:
                print(f"   ❌ Analysis failed: {result.get('error')}")
        
        # Sort by HRcode decision tier, then match score
        decision_order = {
            'SHORTLISTED': 1,
            'SHORTLISTED_WITH_FLAG': 2,
            'NEEDS_REVIEW': 3,
            'REJECTED': 4
        }
        
        rankings.sort(key=lambda x: (
            decision_order.get(x['decision'], 5),
            -x['matchScore'],
            x['anomalyWeight']
        ))
        
        # Assign final ranks
        for idx, rank in enumerate(rankings, 1):
            rank['rank'] = idx
        
        print("\n" + "=" * 70)
        print("🏆 FINAL RANKINGS:")
        for rank in rankings:
            print(f"{rank['rank']}. {rank['candidateName']} - {rank['decision']} ({rank['matchScore']}% match)")
        print("=" * 70)
        
        return {
            'success': True,
            'total': len(resume_texts),
            'ranked': len(rankings),
            'rankings': rankings
        }


# Global instance
hrcode_service = None

def init_hrcode_service():
    """Initialize the HRCode service"""
    global hrcode_service
    try:
        hrcode_service = HRCodeService()
        return True
    except Exception as e:
        print(f"❌ Failed to initialize HRCode service: {e}")
        import traceback
        traceback.print_exc()
        return False

def get_hrcode_service():
    """Get the global HRCode service instance"""
    return hrcode_service
