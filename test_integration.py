"""
Quick test to verify Python AI service is running and accessible
Run this to check if the integration is working
"""

import requests
import json

PYTHON_SERVICE_URL = "http://localhost:5001"

def test_health():
    """Test if Python service is running"""
    print("🔍 Testing Python AI Service Health...")
    try:
        response = requests.get(f"{PYTHON_SERVICE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Python service is RUNNING")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Python service returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Python service is NOT RUNNING")
        print("   Start it with: cd python-service && python app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_parse_resume():
    """Test resume parsing endpoint"""
    print("\n🔍 Testing Resume Parsing...")
    try:
        # This would require an actual file upload
        print("⚠️  Skipping parse test (requires file upload)")
        print("   Test this through the HR Dashboard upload")
        return True
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_analyze_resume():
    """Test AI analysis endpoint"""
    print("\n🔍 Testing AI Analysis...")
    try:
        test_data = {
            "resumeText": "John Doe - Software Engineer with 5 years experience in Python, JavaScript, React, Node.js. BS Computer Science from MIT.",
            "targetRole": "Full Stack Developer"
        }
        response = requests.post(
            f"{PYTHON_SERVICE_URL}/api/analyze-resume",
            json=test_data,
            timeout=30
        )
        if response.status_code == 200 and response.json().get('success'):
            data = response.json()['data']
            print("✅ AI Analysis WORKING")
            print(f"   ATS Score: {data.get('ats_score', 'N/A')}")
            print(f"   Grammar Score: {data.get('grammar_score', 'N/A')}")
            print(f"   Suggestions: {len(data.get('suggestions', []))} provided")
            return True
        else:
            print(f"❌ AI Analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_fraud_detection():
    """Test fraud detection endpoint"""
    print("\n🔍 Testing Fraud Detection...")
    try:
        test_data = {
            "resumeText": "John Doe - Software Engineer",
            "parsedData": {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "skills": ["Python", "JavaScript"],
                "experience": [],
                "education": []
            }
        }
        response = requests.post(
            f"{PYTHON_SERVICE_URL}/api/detect-fraud",
            json=test_data,
            timeout=30
        )
        if response.status_code == 200 and response.json().get('success'):
            data = response.json()['data']
            print("✅ Fraud Detection WORKING")
            print(f"   Risk Level: {data.get('risk_level', 'N/A')}")
            print(f"   Risk Score: {data.get('risk_score', 'N/A')}")
            print(f"   Issues Found: {len(data.get('issues', []))}")
            return True
        else:
            print(f"❌ Fraud Detection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_ranking():
    """Test resume ranking endpoint"""
    print("\n🔍 Testing Resume Ranking...")
    try:
        test_data = {
            "jobDescription": "Looking for Full Stack Developer with React and Node.js experience",
            "resumes": [
                {
                    "id": "1",
                    "text": "John - Full Stack Developer with React, Node.js, 5 years experience",
                    "candidateName": "John Doe"
                },
                {
                    "id": "2",
                    "text": "Jane - Frontend Developer with Vue.js, 2 years experience",
                    "candidateName": "Jane Smith"
                }
            ]
        }
        response = requests.post(
            f"{PYTHON_SERVICE_URL}/api/rank-resumes",
            json=test_data,
            timeout=30
        )
        if response.status_code == 200 and response.json().get('success'):
            data = response.json()['data']
            rankings = data.get('rankings', [])
            print("✅ Ranking WORKING")
            print(f"   Ranked {len(rankings)} candidates")
            if rankings:
                top = rankings[0]
                print(f"   Top candidate: {top.get('candidateName')} ({top.get('matchScore')}% match)")
            return True
        else:
            print(f"❌ Ranking failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("VeriResume Integration Test")
    print("=" * 60)
    print()
    
    results = []
    
    # Test each component
    results.append(("Health Check", test_health()))
    results.append(("AI Analysis", test_analyze_resume()))
    results.append(("Fraud Detection", test_fraud_detection()))
    results.append(("Resume Ranking", test_ranking()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:20s} : {status}")
    
    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {total_passed}/{len(results)} tests passed")
    
    if total_passed == len(results):
        print("\n🎉 All systems operational! Integration is working.")
        print("\nYou can now:")
        print("1. Upload resumes through HR Dashboard")
        print("2. Run AI screening on uploaded resumes")
        print("3. View ATS scores and fraud detection")
        print("4. Rank candidates against job descriptions")
    else:
        print("\n⚠️  Some tests failed. Check the Python service logs.")
        print("Make sure:")
        print("1. Python service is running: cd python-service && python app.py")
        print("2. API keys are configured in .env file")
        print("3. All dependencies are installed: pip install -r requirements.txt")

if __name__ == "__main__":
    main()
