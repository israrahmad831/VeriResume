"""
Direct Resume Screening Test
Tests the Python AI service with uploaded resumes
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python-service'))

from modules.hr_system import HRSystem
from modules.resume_parser import ResumeParser
import json
from pathlib import Path

def test_screening():
    print("\n" + "="*70)
    print("🔍 VERIRESUME - DIRECT SCREENING TEST")
    print("="*70 + "\n")
    
    # Initialize HR System
    print("⏳ Initializing HR System...")
    try:
        hr_system = HRSystem()
        print("✅ HR System initialized!\n")
    except Exception as e:
        print(f"❌ Failed to initialize HR System: {e}\n")
        return
    
    # Initialize parser
    parser = ResumeParser()
    
    # Get uploaded resumes
    uploads_folder = Path("website-VeriResume/uploads")
    if not uploads_folder.exists():
        print(f"❌ Uploads folder not found: {uploads_folder}\n")
        return
    
    resume_files = list(uploads_folder.glob("*.pdf"))[:5]  # Test with 5 resumes
    
    if not resume_files:
        print("❌ No PDF resumes found in uploads folder\n")
        return
    
    print(f"📁 Found {len(resume_files)} resumes to test\n")
    print("-"*70 + "\n")
    
    # Job description for testing
    job_description = """
    We are looking for a Full Stack Developer with experience in:
    - React.js and TypeScript
    - Node.js and Express
    - MongoDB or PostgreSQL
    - REST API development
    - Git version control
    
    Preferred: 2+ years experience, Bachelor's degree in Computer Science
    """
    
    print("📋 Job Description:")
    print(job_description)
    print("\n" + "-"*70 + "\n")
    
    results = []
    
    # Process each resume
    for i, resume_file in enumerate(resume_files, 1):
        print(f"\n{'='*70}")
        print(f"📄 Resume {i}/{len(resume_files)}: {resume_file.name}")
        print('='*70)
        
        try:
            # Step 1: Parse Resume
            print("\n⏳ Step 1: Parsing resume...")
            parsed_data = parser.parse_resume(str(resume_file))
            
            if 'error' in parsed_data:
                print(f"❌ Parsing failed: {parsed_data['error']}")
                continue
            
            # Flatten the structure
            candidate_info = parsed_data.get('candidate_info', {})
            flattened_data = {
                'name': candidate_info.get('name', 'Unknown'),
                'email': candidate_info.get('email', 'N/A'),
                'phone': candidate_info.get('phone', 'N/A'),
                'skills': parsed_data.get('skills', []),
                'education': parsed_data.get('education', []),
                'experience': parsed_data.get('experience', []),
                'raw_text': parsed_data.get('raw_text', '')
            }
            
            print(f"✅ Parsed successfully!")
            print(f"   Name: {flattened_data['name']}")
            print(f"   Email: {flattened_data['email']}")
            print(f"   Skills: {len(flattened_data['skills'])} found")
            
            # Step 2: AI Analysis (ATS Score)
            print("\n⏳ Step 2: Analyzing with AI...")
            ai_analysis = hr_system.analyzer.analyze_resume(
                flattened_data['raw_text'],
                job_description
            )
            
            ats_score = ai_analysis.get('ats_score', 0)
            match_score = ai_analysis.get('match_score', 0)
            print(f"✅ AI Analysis complete!")
            print(f"   ATS Score: {ats_score}%")
            print(f"   Match Score: {match_score}%")
            
            # Step 3: Fraud Detection
            print("\n⏳ Step 3: Fraud detection...")
            fraud_report = hr_system.fraud_detector.detect_fraud(flattened_data)
            
            fraud_score = fraud_report.get('fraud_score', 0)
            risk_level = fraud_report.get('risk_level', 'Unknown')
            issues = fraud_report.get('issues', [])
            
            print(f"✅ Fraud check complete!")
            print(f"   Fraud Score: {fraud_score}/100")
            print(f"   Risk Level: {risk_level}")
            if issues:
                print(f"   Issues found: {len(issues)}")
                for issue in issues[:3]:
                    print(f"      - {issue}")
            else:
                print(f"   ✅ No issues detected")
            
            # Store results
            results.append({
                'rank': i,
                'file': resume_file.name,
                'name': flattened_data['name'],
                'email': flattened_data['email'],
                'ats_score': ats_score,
                'match_score': match_score,
                'fraud_score': fraud_score,
                'risk_level': risk_level,
                'skills': flattened_data['skills'][:5],
                'issues': issues
            })
            
            print(f"\n{'✅ SUCCESS' if risk_level == 'Low' else '⚠️ WARNING'}: Resume processed successfully!")
            
        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            continue
    
    # Display Summary
    print("\n" + "="*70)
    print("📊 SCREENING RESULTS SUMMARY")
    print("="*70 + "\n")
    
    if not results:
        print("❌ No resumes were successfully processed\n")
        return
    
    # Sort by match score
    results.sort(key=lambda x: x['match_score'], reverse=True)
    
    print(f"✅ Successfully processed: {len(results)}/{len(resume_files)} resumes\n")
    
    # Display top candidates
    print("🏆 TOP CANDIDATES:\n")
    medals = ['🥇', '🥈', '🥉', '🎖️', '🎖️']
    
    for i, result in enumerate(results, 1):
        medal = medals[i-1] if i <= len(medals) else '📄'
        risk_emoji = '🟢' if result['risk_level'] == 'Low' else '🟡' if result['risk_level'] == 'Medium' else '🔴'
        
        print(f"{medal} Rank #{i}: {result['name']}")
        print(f"   Email: {result['email']}")
        print(f"   📊 Match Score: {result['match_score']}%")
        print(f"   📈 ATS Score: {result['ats_score']}%")
        print(f"   {risk_emoji} Risk: {result['risk_level']} ({result['fraud_score']}/100)")
        
        if result['skills']:
            print(f"   💼 Skills: {', '.join(result['skills'][:5])}")
        
        if result['issues']:
            print(f"   ⚠️ Issues: {len(result['issues'])} detected")
            for issue in result['issues'][:2]:
                print(f"      - {issue}")
        
        print()
    
    # Statistics
    print("-"*70)
    print("📈 STATISTICS:\n")
    
    avg_ats = sum(r['ats_score'] for r in results) / len(results)
    avg_match = sum(r['match_score'] for r in results) / len(results)
    
    low_risk = sum(1 for r in results if r['risk_level'] == 'Low')
    medium_risk = sum(1 for r in results if r['risk_level'] == 'Medium')
    high_risk = sum(1 for r in results if r['risk_level'] == 'High')
    
    print(f"Average ATS Score: {avg_ats:.1f}%")
    print(f"Average Match Score: {avg_match:.1f}%")
    print(f"\nRisk Distribution:")
    print(f"  🟢 Low Risk: {low_risk} candidates")
    print(f"  🟡 Medium Risk: {medium_risk} candidates")
    print(f"  🔴 High Risk: {high_risk} candidates")
    
    print("\n" + "="*70)
    print("✅ SCREENING TEST COMPLETED!")
    print("="*70 + "\n")
    
    # Save results to JSON
    output_file = "screening_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Results saved to: {output_file}\n")

if __name__ == "__main__":
    test_screening()
