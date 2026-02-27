"""
Test script for Bulk Resume Screening with Anomaly Filtering
Demonstrates how the system processes multiple resumes and filters based on anomaly weight
"""

from modules.anomaly_detector import AnomalyDetector

def test_bulk_screening():
    """Simulate bulk resume screening with various candidates"""
    
    detector = AnomalyDetector()
    
    # Sample candidates with different quality levels
    candidates = [
        {
            'name': 'Alice Johnson - Excellent Candidate',
            'resume': {
                'candidate_info': {'name': 'Alice Johnson', 'email': 'alice@example.com'},
                'skills': ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
                'education': [{'degree': 'BS Computer Science', 'institution': 'MIT', 'year': '2020'}],
                'experience': [
                    {'title': 'Senior Developer', 'company': 'Tech Corp', 'duration': '2020-2024'},
                    {'title': 'Developer', 'company': 'Startup Inc', 'duration': '2018-2020'}
                ]
            },
            'expected_weight': 0
        },
        {
            'name': 'Bob Smith - Minor Issues',
            'resume': {
                'candidate_info': {'name': 'Bob Smith', 'email': 'bob@example.com'},
                'skills': ['JavaScript', 'React', 'Node.js', 'English', 'MS Excel'],  # 2 issues
                'education': [{'degree': 'BS Software Engineering', 'institution': 'Stanford', 'year': '2019'}],
                'experience': [{'title': 'Full Stack Developer', 'company': 'WebCo', 'duration': '2019-2024'}]
            },
            'expected_weight': 11  # MEDIUM(8) + LOW(3) = 11
        },
        {
            'name': 'Charlie Brown - Moderate Issues',
            'resume': {
                'candidate_info': {'name': 'Charlie Brown', 'email': 'charlie@example.com'},
                'skills': ['Python', 'Python', 'English', 'Urdu', 'MS Word'],  # 5 issues
                'education': [{'degree': 'BS CS', 'institution': 'Local University', 'year': '2021'}],
                'experience': [{'title': 'Developer', 'company': 'Small Firm', 'duration': '2021-2024'}]
            },
            'expected_weight': 22  # MEDIUM(8)*2 + LOW(3)*2 = 22
        },
        {
            'name': 'Diana Prince - Serious Issues',
            'resume': {
                'candidate_info': {'name': 'Diana Prince', 'email': 'diana@example.com'},
                'skills': ['Java', 'English', 'French', 'MS Word', 'MS PowerPoint'],  # Multiple issues
                'education': [
                    {'degree': 'BS Computer Science', 'institution': 'University', 'year': '2020'},
                    {'degree': 'Worked as Developer at Tech Company', 'institution': 'Built apps', 'year': '2020'}  # HIGH
                ],
                'experience': [
                    {'title': 'Bachelor in IT from College', 'company': 'Education Institute', 'duration': '2016-2020'},  # HIGH
                    {'title': 'Software Engineer', 'company': 'TechCorp', 'duration': '2020-2024'}
                ]
            },
            'expected_weight': 45  # Should be rejected
        },
        {
            'name': 'Eve Martinez - Critical Issues',
            'resume': {
                'candidate_info': {'name': 'Eve Martinez', 'email': 'eve@example.com'},
                'skills': ['Python', 'Python', 'English', 'Urdu', 'Spanish', 'MS Word', 'Excel'],  # Many issues
                'education': [
                    {'degree': 'Worked as Senior Engineer', 'institution': 'Tech Solutions', 'year': '2020'},  # HIGH
                    {'degree': 'BS CS', 'institution': 'University', 'year': '2019'}
                ],
                'experience': [
                    {'title': 'Master Degree in Software Engineering', 'company': 'University of Tech', 'duration': '2017-2019'},  # HIGH
                    {'title': 'Developer', 'company': 'StartupXYZ', 'duration': '2019-2024'},
                    {'title': 'Developer', 'company': 'StartupXYZ', 'duration': '2019-2024'}  # Duplicate
                ]
            },
            'expected_weight': 70  # Should definitely be rejected
        }
    ]
    
    print("=" * 80)
    print("🔍 BULK RESUME SCREENING SIMULATION")
    print("=" * 80)
    print(f"Total Candidates: {len(candidates)}")
    print(f"Anomaly Threshold: 30")
    print("=" * 80)
    print()
    
    shortlisted = []
    rejected = []
    THRESHOLD = 30
    
    for idx, candidate in enumerate(candidates, 1):
        print(f"\n[{idx}/{len(candidates)}] Processing: {candidate['name']}")
        print("-" * 80)
        
        # Detect anomalies
        anomalies = detector.detect_anomalies(candidate['resume'])
        weight = anomalies['weight']
        
        # Check shortlist decision
        decision = detector.should_shortlist(anomalies, threshold=THRESHOLD)
        
        # Display results
        print(f"📊 Anomaly Count: {anomalies['anomaly_count']}")
        print(f"⚖️  Anomaly Weight: {weight}")
        print(f"🎯 Severity: {anomalies['severity'].upper()}")
        print(f"📝 Decision: {decision['decision']}")
        
        if weight > 0:
            print(f"\nIssues Found:")
            for issue in anomalies['issues']:
                print(f"  • [{issue['severity'].upper()}] {issue['type']}: {issue['value']}")
        
        print(f"\n{'✅' if decision['shortlisted'] else '❌'} {decision['reason']}")
        
        if decision['shortlisted']:
            shortlisted.append({
                'name': candidate['name'],
                'email': candidate['resume']['candidate_info']['email'],
                'weight': weight,
                'severity': anomalies['severity']
            })
        else:
            rejected.append({
                'name': candidate['name'],
                'email': candidate['resume']['candidate_info']['email'],
                'weight': weight,
                'severity': anomalies['severity'],
                'reason': decision['reason']
            })
    
    # Summary
    print("\n\n" + "=" * 80)
    print("📊 SCREENING RESULTS")
    print("=" * 80)
    
    print(f"\n✅ SHORTLISTED CANDIDATES ({len(shortlisted)}):")
    print("-" * 80)
    for i, candidate in enumerate(shortlisted, 1):
        print(f"{i}. {candidate['name']}")
        print(f"   Email: {candidate['email']}")
        print(f"   Weight: {candidate['weight']} | Severity: {candidate['severity'].upper()}")
        print()
    
    print(f"❌ REJECTED CANDIDATES ({len(rejected)}):")
    print("-" * 80)
    for i, candidate in enumerate(rejected, 1):
        print(f"{i}. {candidate['name']}")
        print(f"   Email: {candidate['email']}")
        print(f"   Weight: {candidate['weight']} | Severity: {candidate['severity'].upper()}")
        print(f"   Reason: {candidate['reason']}")
        print()
    
    print("=" * 80)
    print(f"SUMMARY: {len(shortlisted)} Shortlisted | {len(rejected)} Rejected | Threshold: {THRESHOLD}")
    print("=" * 80)
    
    # Verify expected results
    print("\n✅ VALIDATION:")
    assert len(shortlisted) == 3, f"Expected 3 shortlisted, got {len(shortlisted)}"
    assert len(rejected) == 2, f"Expected 2 rejected, got {len(rejected)}"
    print("All tests passed! ✓")
    
    return {
        'shortlisted': shortlisted,
        'rejected': rejected,
        'total': len(candidates),
        'threshold': THRESHOLD
    }


if __name__ == '__main__':
    print("\n🚀 TESTING BULK RESUME SCREENING WITH ANOMALY FILTERING\n")
    results = test_bulk_screening()
    print(f"\n✅ Test completed successfully!")
    print(f"   Acceptance Rate: {len(results['shortlisted']) / results['total'] * 100:.1f}%")
    print(f"   Rejection Rate: {len(results['rejected']) / results['total'] * 100:.1f}%")
