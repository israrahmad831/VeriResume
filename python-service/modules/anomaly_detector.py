"""
VeriResume Anomaly Detector
Detects data quality issues and potential fraud indicators in resumes
"""

from typing import Dict, List, Any


class AnomalyDetector:
    """Detects data quality issues and potential fraud indicators in resumes"""
    
    def __init__(self):
        # Spoken languages (should NOT be in technical skills)
        self.spoken_languages = {
            'english', 'urdu', 'punjabi', 'sindhi', 'pashto', 'hindi',
            'arabic', 'french', 'spanish', 'german', 'chinese'
        }
        
        # Generic software (low-value skills)
        self.generic_software = {
            'ms word', 'microsoft word', 'word',
            'ms excel', 'microsoft excel', 'excel',
            'ms powerpoint', 'powerpoint', 'ppt',
            'ms office', 'microsoft office',
            'windows', 'outlook', 'internet', 'email'
        }
        
        # Education keywords
        self.education_keywords = {
            'bachelor', 'master', 'phd', 'degree', 'diploma', 'bs', 'ms', 'mba',
            'university', 'college', 'institute', 'graduated', 'cgpa', 'gpa',
            'matriculation', 'intermediate'
        }
        
        # Experience keywords - STRICT (only clear job indicators)
        self.experience_job_titles = {
            'software engineer', 'data analyst', 'project manager', 'team lead',
            'senior developer', 'junior developer', 'intern at', 'trainee at',
            'consultant at', 'analyst at', 'engineer at', 'manager at',
            'developer at', 'designer at', 'coordinator at', 'specialist at',
            'associate at', 'executive at', 'director at', 'ceo', 'cto'
        }
        
        # Work-specific phrases (not common in education)
        self.experience_phrases = {
            'employed at', 'worked at', 'working at', 'hired by',
            'full-time position', 'part-time position', 'contract position',
            'remote position', 'on-site position', 'employment period',
            'job responsibilities', 'reported to', 'supervised team',
            'company:', 'employer:', 'organization:', 'firm:'
        }
    
    def detect_anomalies(self, parsed_data: Dict) -> Dict[str, Any]:
        """Main anomaly detection function"""
        
        anomalies = {
            'has_anomalies': False,
            'anomaly_count': 0,
            'severity': 'none',
            'weight': 0,  # 0-100 weighted score
            'issues': [],
            'details': {
                'languages_in_skills': [],
                'generic_software_in_skills': [],
                'education_in_experience': [],
                'experience_in_education': [],
                'duplicate_skills': [],
                'duplicate_experiences': []
            }
        }
        
        # Extract sections
        candidate_info = parsed_data.get('candidate_info', {})
        skills = parsed_data.get('skills', [])
        education = parsed_data.get('education', [])
        experience = parsed_data.get('experience', [])
        
        # Run all checks
        self._check_missing_contact_info(candidate_info, anomalies)
        self._check_languages_in_skills(skills, anomalies)
        self._check_generic_software(skills, anomalies)
        self._check_education_in_experience(experience, anomalies)
        self._check_experience_in_education(education, anomalies)
        self._check_duplicate_skills(skills, anomalies)
        self._check_duplicate_experiences(experience, anomalies)
        
        # Calculate weight (HIGH=15, MEDIUM=8, LOW=3)
        anomalies['has_anomalies'] = len(anomalies['issues']) > 0
        anomalies['anomaly_count'] = len(anomalies['issues'])
        
        weight = 0
        for issue in anomalies['issues']:
            if issue['severity'] == 'high':
                weight += 15
            elif issue['severity'] == 'medium':
                weight += 8
            elif issue['severity'] == 'low':
                weight += 3
        
        anomalies['weight'] = min(weight, 100)
        
        # Determine overall severity
        if anomalies['weight'] == 0:
            anomalies['severity'] = 'none'
        elif anomalies['weight'] <= 10:
            anomalies['severity'] = 'low'
        elif anomalies['weight'] <= 30:
            anomalies['severity'] = 'medium'
        else:
            anomalies['severity'] = 'high'
        
        return anomalies
    
    def _check_missing_contact_info(self, candidate_info: Dict, anomalies: Dict):
        """Check for missing critical contact information - HIGH SEVERITY"""
        name = candidate_info.get('name', '')
        email = candidate_info.get('email')
        phone = candidate_info.get('phone')
        
        # Check missing or generic name
        if not name or name in ['Unknown Candidate', 'EDUCATION', 'Contact', 'Phone', 
                                'SUMMARY', 'Profile', 'Resume', 'CERTIFICATIONS', 
                                'Personal Information:', 'EXPERIENCE']:
            anomalies['issues'].append({
                'type': 'missing_name',
                'severity': 'high',
                'field': 'candidate_info',
                'value': name or 'Not provided',
                'details': 'Candidate name is missing or unclear. This shows lack of professionalism and basic resume knowledge. A professional candidate always clearly states their name at the top.',
                'message': f'Missing/unclear candidate name: "{name}"'
            })
        
        # Check missing email
        if not email:
            anomalies['issues'].append({
                'type': 'missing_email',
                'severity': 'high',
                'field': 'candidate_info',
                'value': 'Not provided',
                'details': 'Email address is missing. This is a critical contact method and shows lack of basic resume sense. No email = cannot contact for interviews. This indicates the candidate does not understand professional job application standards.',
                'message': 'Missing email address'
            })
        
        # Check missing phone
        if not phone:
            anomalies['issues'].append({
                'type': 'missing_phone',
                'severity': 'high',
                'field': 'candidate_info',
                'value': 'Not provided',
                'details': 'Phone number is missing. This is essential for urgent communication and interview scheduling. Missing contact info shows the candidate lacks basic understanding of job application requirements and professionalism.',
                'message': 'Missing phone number'
            })
    
    def _check_languages_in_skills(self, skills: List[str], anomalies: Dict):
        """Check if spoken languages are listed as technical skills"""
        for skill in skills:
            if skill.lower().strip() in self.spoken_languages:
                anomalies['details']['languages_in_skills'].append(skill)
                anomalies['issues'].append({
                    'type': 'language_as_skill',
                    'severity': 'medium',
                    'field': 'skills',
                    'value': skill,
                    'details': f'Spoken language "{skill}" listed as technical skill - should be in separate Languages section',
                    'message': f'Language as skill: {skill}'
                })
    
    def _check_generic_software(self, skills: List[str], anomalies: Dict):
        """Check for generic/basic software as skills"""
        for skill in skills:
            if skill.lower().strip() in self.generic_software:
                anomalies['details']['generic_software_in_skills'].append(skill)
                anomalies['issues'].append({
                    'type': 'generic_software',
                    'severity': 'low',
                    'field': 'skills',
                    'value': skill,
                    'details': f'Generic software "{skill}" has low value for technical roles',
                    'message': f'Generic software: {skill}'
                })
    
    def _check_education_in_experience(self, experience: List[Dict], anomalies: Dict):
        """Check if education details are in experience section - IMPROVED PRECISION"""
        for exp in experience:
            title = exp.get('title', '').lower()
            company = exp.get('company', '').lower()
            combined = f"{title} {company}"
            
            # Look for specific degree types (not just keywords)
            degree_indicators = ['bachelor', 'master', 'phd', 'doctorate', 
                                'bs ', 'ms ', 'mba', 'bba', 'bcs', 'mcs',
                                'matriculation', 'intermediate', 'fsc', 'ics']
            
            # Look for educational institution indicators
            institution_indicators = ['university', 'college', 'school', 'institute']
            
            # Check if clear degree type is mentioned
            degree_found = [deg for deg in degree_indicators if deg in combined]
            
            # Check if educational institution mentioned as company
            institution_found = [inst for inst in institution_indicators 
                               if inst in company and not any(work in company for work in 
                               ['solutions', 'systems', 'technologies', 'consulting', 'software'])]
            
            # Only flag if BOTH degree indicators AND institution found
            # OR if degree type explicitly mentioned in job title
            if (degree_found and institution_found) or any(deg in title for deg in degree_indicators):
                anomalies['details']['education_in_experience'].append({
                    'title': exp.get('title', ''),
                    'company': exp.get('company', ''),
                    'indicators': degree_found + institution_found
                })
                anomalies['issues'].append({
                    'type': 'education_in_experience',
                    'severity': 'high',
                    'field': 'experience',
                    'value': f"{exp.get('title', '')} at {exp.get('company', '')}",
                    'details': f'Education content found in work experience: degree "{", ".join(degree_found)}" or institution "{", ".join(institution_found)}"',
                    'message': f'Education in experience: {exp.get("title", "")}'
                })
    
    def _check_experience_in_education(self, education: List[Dict], anomalies: Dict):
        """Check if work experience details are in education section - IMPROVED PRECISION"""
        for edu in education:
            degree = edu.get('degree', '').lower()
            institution = edu.get('institution', '').lower()
            combined = f"{degree} {institution}"
            
            # Check for job titles (more specific than generic keywords)
            job_titles_found = [title for title in self.experience_job_titles if title in combined]
            
            # Check for work-specific phrases
            work_phrases_found = [phrase for phrase in self.experience_phrases if phrase in combined]
            
            # Only flag if we find clear job indicators (not generic action words)
            if job_titles_found or work_phrases_found:
                anomalies['details']['experience_in_education'].append({
                    'degree': edu.get('degree', ''),
                    'institution': edu.get('institution', ''),
                    'indicators': job_titles_found + work_phrases_found
                })
                anomalies['issues'].append({
                    'type': 'experience_in_education',
                    'severity': 'high',
                    'field': 'education',
                    'value': f"{edu.get('degree', '')} at {edu.get('institution', '')}",
                    'details': f'Work position/company name found in education: "{", ".join(job_titles_found + work_phrases_found)}"',
                    'message': f'Experience in education: {edu.get("degree", "")}'
                })
    
    def _check_duplicate_skills(self, skills: List[str], anomalies: Dict):
        """Check for duplicate skills"""
        seen = set()
        for skill in skills:
            skill_normalized = skill.lower().strip()
            if skill_normalized in seen:
                anomalies['details']['duplicate_skills'].append(skill)
                anomalies['issues'].append({
                    'type': 'duplicate_skill',
                    'severity': 'low',
                    'field': 'skills',
                    'value': skill,
                    'details': f'Duplicate skill "{skill}" found',
                    'message': f'Duplicate: {skill}'
                })
            else:
                seen.add(skill_normalized)
    
    def _check_duplicate_experiences(self, experience: List[Dict], anomalies: Dict):
        """Check for duplicate work experiences"""
        seen = set()
        for exp in experience:
            exp_key = f"{exp.get('title', '').lower()}_{exp.get('company', '').lower()}"
            if exp_key in seen and exp_key != '_':
                anomalies['details']['duplicate_experiences'].append(exp)
                anomalies['issues'].append({
                    'type': 'duplicate_experience',
                    'severity': 'medium',
                    'field': 'experience',
                    'value': f"{exp.get('title', '')} at {exp.get('company', '')}",
                    'details': f'Duplicate experience entry found',
                    'message': f'Duplicate: {exp.get("title", "")}'
                })
            else:
                seen.add(exp_key)
    
    def should_shortlist(self, anomalies: Dict, threshold: int = 30, match_score: int = 0) -> Dict[str, Any]:
        """
        Smart shortlisting decision based on BOTH anomaly weight AND match score
        
        LOGIC:
        - High match (≥65%): Shortlist even with anomalies (flag for review)
        - Medium match (45-65%): Needs review if high anomalies
        - Low match (<45%): Reject if anomalies high OR qualifications low
        """
        
        weight = anomalies.get('weight', 0)
        
        # High qualifications - shortlist even with formatting issues
        if match_score >= 65:
            if weight > threshold:
                return {
                    'shortlisted': True,
                    'decision_status': 'SHORTLISTED_WITH_FLAG',
                    'reason': f'Strong qualifications ({match_score}%) outweigh formatting issues (Anomaly: {weight})',
                    'recommendation': f'⚠️ FLAG: Excellent candidate but resume needs cleanup. Verify in interview.'
                }
            else:
                return {
                    'shortlisted': True,
                    'decision_status': 'SHORTLISTED',
                    'reason': f'Excellent match ({match_score}%) with good resume quality',
                    'recommendation': 'Strong candidate - proceed to interview.'
                }
        
        # Medium qualifications - manual review if anomalies high
        elif match_score >= 45:
            if weight > threshold:
                return {
                    'shortlisted': True,
                    'decision_status': 'NEEDS_REVIEW',
                    'reason': f'Moderate match ({match_score}%) with quality concerns ({weight})',
                    'recommendation': '⚠️ MANUAL REVIEW: Has potential but needs verification.'
                }
            else:
                return {
                    'shortlisted': True,
                    'decision_status': 'SHORTLISTED',
                    'reason': f'Good match ({match_score}%) with acceptable quality',
                    'recommendation': 'Solid candidate - proceed with evaluation.'
                }
        
        # Low qualifications - reject
        else:
            if weight > threshold:
                return {
                    'shortlisted': False,
                    'decision_status': 'REJECTED',
                    'reason': f'Low match ({match_score}%) + poor quality ({weight})',
                    'recommendation': 'Not recommended - both skills mismatch and quality issues.'
                }
            else:
                return {
                    'shortlisted': False,
                    'decision_status': 'REJECTED',
                    'reason': f'Insufficient qualifications match ({match_score}%)',
                    'recommendation': 'Skills and experience do not align with requirements.'
                }
