#!/usr/bin/env python
"""Test the HTTP-based job scraper"""

from modules.job_scraper import JobScraper
import json

print("\n" + "="*60)
print("TESTING HTTP-BASED JOB SCRAPER")
print("="*60)

scraper = JobScraper(headless=True)
print("\n🔍 Scraping for 'Python Developer' in 'Karachi'...")

results = scraper.search_jobs('Python Developer', 'Karachi', max_per_platform=2)

print(f"\n{'='*60}")
print("RESULTS:")
print(f"{'='*60}")
print(f"✓ Total jobs found: {results['statistics']['total_jobs']}")
print(f"✓ Indeed jobs: {len(results['jobsByPlatform'].get('indeed', []))}")
print(f"✓ Rozee jobs: {len(results['jobsByPlatform'].get('rozee', []))}")

if results['allJobs']:
    print(f"\n📋 Sample Jobs:")
    for i, job in enumerate(results['allJobs'][:3], 1):
        print(f"  {i}. {job['title']}")
        print(f"     Company: {job['company']}")
        print(f"     Location: {job['location']}")
        print(f"     Source: {job['source'].upper()}")
        print()
else:
    print("\n❌ ERROR: No jobs were scraped!")
    print("\nPossible issues:")
    print("  1. Job sites may be blocking the requests")
    print("  2. BeautifulSoup selectors may be incorrect") 
    print("  3. Network connectivity issue")
    print("  4. SSL/certificate issue")
