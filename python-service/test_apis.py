"""Quick test of all 3 job APIs"""
import requests

FINDWORK_KEY = "8dd7bab263ba17c3061719caa90e43b8bb0c0b2e"
ADZUNA_ID = "a8e60b6e"
ADZUNA_KEY = "c5209d39688259083049d0c3"
USAJOBS_KEY = "n+MkK828oEsGs2eLZu+tms6V4bnYqOhff8z+H5z0gVQ="

print("=== Testing FindWork ===")
try:
    r = requests.get(
        "https://findwork.dev/api/jobs/?search=Python+Developer&order_by=-date_posted",
        headers={"Authorization": f"Token {FINDWORK_KEY}", "Accept": "application/json"},
        timeout=15
    )
    print(f"Status: {r.status_code}")
    data = r.json()
    print(f"Total count: {data.get('count', 0)}")
    results = data.get("results", [])
    print(f"Results returned: {len(results)}")
    for j in results[:3]:
        print(f"  - {j.get('role')} @ {j.get('company_name')}")
except Exception as e:
    print(f"FindWork ERROR: {e}")

print()
print("=== Testing Adzuna ===")
try:
    r = requests.get(
        f"https://api.adzuna.com/v1/api/jobs/gb/search/1",
        params={"app_id": ADZUNA_ID, "app_key": ADZUNA_KEY, "what": "Python Developer", "results_per_page": 5},
        timeout=15
    )
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        results = data.get("results", [])
        print(f"Results: {len(results)}")
        for j in results[:3]:
            print(f"  - {j.get('title')} @ {j.get('company', {}).get('display_name')}")
    else:
        print(f"Response: {r.text[:200]}")
except Exception as e:
    print(f"Adzuna ERROR: {e}")

print()
print("=== Testing USAJobs ===")
try:
    r = requests.get(
        "https://data.usajobs.gov/api/Search",
        headers={"Authorization-Key": USAJOBS_KEY, "User-Agent": "saadabdullah7216@gmail.com", "Host": "data.usajobs.gov"},
        params={"Keyword": "Python Developer", "ResultsPerPage": 5},
        timeout=15
    )
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        items = data.get("SearchResult", {}).get("SearchResultItems", [])
        print(f"Results: {len(items)}")
        for j in items[:3]:
            desc = j.get("MatchedObjectDescriptor", {})
            print(f"  - {desc.get('PositionTitle')} @ {desc.get('OrganizationName')}")
    else:
        print(f"Response: {r.text[:200]}")
except Exception as e:
    print(f"USAJobs ERROR: {e}")
