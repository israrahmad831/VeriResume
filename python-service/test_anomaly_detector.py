"""
Test script for Anomaly Detection feature
Tests detection of common resume data quality issues
"""

from modules.anomaly_detector import AnomalyDetector

def test_anomaly_detection():
    """Test anomaly detector with sample data"""
    
    detector = AnomalyDetector()
    
    # Test Case 1: Resume with multiple anomalies
    print("=" * 70)
    print("TEST CASE 1: Resume with Multiple Anomalies")
    print("=" * 70)
    
    test_resume_1 = {
        'candidate_info': {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '+92-300-1234567'
        },
        'skills': [
            'Python',
            'JavaScript',
            'English',  # ANOMALY: Language as skill
            'Urdu',     # ANOMALY: Language as skill
            'MS Word',  # ANOMALY: Generic software
            'MS Excel', # ANOMALY: Generic software
            'React',
            'Python',   # ANOMALY: Duplicate
            'Node.js'
        ],
        'education': [
            {
                'degree': 'Bachelor in Computer Science',
                'institution': 'FAST University',
                'year': '2020'
            },
            {
                'degree': 'Worked as Software Engineer at ABC Company',  # ANOMALY: Experience in education
                'institution': 'Developed web applications',
                'year': '2021'
            }
        ],
        'experience': [
            {
                'title': 'Software Engineer',
                'company': 'XYZ Tech',
                'duration': '2020-2023'
            },
            {
                'title': 'Bachelor in Software Engineering',  # ANOMALY: Education in experience
                'company': 'University of Karachi',
                'duration': '2016-2020'
            },
            {
                'title': 'Software Engineer',  # ANOMALY: Duplicate
                'company': 'XYZ Tech',
                'duration': '2020-2023'
            }
        ]
    }
    
    anomalies_1 = detector.detect_anomalies(test_resume_1)
    report_1 = detector.generate_anomaly_report(anomalies_1)
    
    print(f"\nAnomaly Count: {anomalies_1['anomaly_count']}")
    print(f"Severity: {anomalies_1['severity'].upper()}")
    print(f"\n{report_1}")
    
    print("\nDetailed Issues:")
    for issue in anomalies_1['issues']:
        print(f"  - [{issue['severity'].upper()}] {issue['type']}: {issue['value']}")
    
    # Test Case 2: Clean resume with no anomalies
    print("\n\n" + "=" * 70)
    print("TEST CASE 2: Clean Resume (No Anomalies)")
    print("=" * 70)
    
    test_resume_2 = {
        'candidate_info': {
            'name': 'Jane Smith',
            'email': 'jane@example.com',
            'phone': '+92-321-9876543'
        },
        'skills': [
            'Python',
            'Django',
            'PostgreSQL',
            'Docker',
            'AWS',
            'React',
            'TypeScript'
        ],
        'education': [
            {
                'degree': 'Master in Computer Science',
                'institution': 'NUST',
                'year': '2022'
            },
            {
                'degree': 'Bachelor in Software Engineering',
                'institution': 'FAST University',
                'year': '2020'
            }
        ],
        'experience': [
            {
                'title': 'Senior Software Engineer',
                'company': 'Tech Solutions Inc',
                'duration': '2022-Present'
            },
            {
                'title': 'Software Engineer',
                'company': 'Startup XYZ',
                'duration': '2020-2022'
            }
        ]
    }
    
    anomalies_2 = detector.detect_anomalies(test_resume_2)
    report_2 = detector.generate_anomaly_report(anomalies_2)
    
    print(f"\nAnomaly Count: {anomalies_2['anomaly_count']}")
    print(f"Severity: {anomalies_2['severity'].upper()}")
    print(f"\n{report_2}")
    
    # Test Case 3: Specific anomaly types
    print("\n\n" + "=" * 70)
    print("TEST CASE 3: Specific Anomaly Types")
    print("=" * 70)
    
    test_resume_3 = {
        'candidate_info': {
            'name': 'Test User',
            'email': 'test@example.com',
            'phone': '+92-300-0000000'
        },
        'skills': [
            'French',  # Language
            'PowerPoint',  # Generic
            'Docker'
        ],
        'education': [],
        'experience': []
    }
    
    anomalies_3 = detector.detect_anomalies(test_resume_3)
    report_3 = detector.generate_anomaly_report(anomalies_3)
    
    print(f"\n{report_3}")
    print("\n\nDetails by Type:")
    print(f"Languages in Skills: {anomalies_3['details']['languages_in_skills']}")
    print(f"Generic Software: {anomalies_3['details']['generic_software_in_skills']}")
    
    print("\n" + "=" * 70)
    print("TESTING COMPLETE")
    print("=" * 70)
    
    return {
        'test_1': anomalies_1,
        'test_2': anomalies_2,
        'test_3': anomalies_3
    }


if __name__ == '__main__':
    print("\n🔍 ANOMALY DETECTOR TEST SUITE\n")
    results = test_anomaly_detection()
    print(f"\n✅ All tests completed successfully!")
    print(f"\nTest 1: {results['test_1']['anomaly_count']} anomalies detected ({results['test_1']['severity']})")
    print(f"Test 2: {results['test_2']['anomaly_count']} anomalies detected ({results['test_2']['severity']})")
    print(f"Test 3: {results['test_3']['anomaly_count']} anomalies detected ({results['test_3']['severity']})")
