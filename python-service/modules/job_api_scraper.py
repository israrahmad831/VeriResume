# -*- coding: utf-8 -*-
"""
VeriResume - Job API Scraper
Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
:3000/api/admin/stats:1  Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
:3000/api/admin/user-growth:1  Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
:3000/api/admin/recent-users:1  Failed to load resource: the server responded with a status of 404 (Not Found)Understand this error
:3000/api/admin/anomaly-reports:1  Failed to load resource: the server responded with a status of 404 (Not Found)Fetches real jobs from 4 FREE APIs (zero API keys needed for 3 of them):
  1. Remotive.com      (Remote tech jobs — NO KEY required)
  2. Jobicy.com        (Remote jobs globally — NO KEY required)
  3. Arbeitnow.com     (EU + Remote jobs — NO KEY required)
  4. USAJobs.gov       (US Government jobs — free API key)

All APIs return clean JSON. No Selenium, no browser required.
"""

import logging
import requests
import urllib.parse
import re
from typing import List, Dict
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── API CREDENTIALS (only USAJobs needs a key) ──────────────
USAJOBS_API_KEY = "n+MkK828oEsGs2eLZu+tms6V4bnYqOhff8z+H5z0gVQ="
USAJOBS_EMAIL = "saadabdullah7216@gmail.com"


class JobAPIScraper:
    """Fetches jobs from Remotive, Jobicy, Arbeitnow and USAJobs APIs."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "VeriResume/1.0 (job search app)",
            "Accept": "application/json",
        })
        logger.info("[JobAPIScraper] Initialized with Remotive + Jobicy + Arbeitnow + USAJobs")

    # ════════════════════════════════════════════════════════════
    #  1.  REMOTIVE.COM  (Remote tech jobs, NO KEY)
    # ════════════════════════════════════════════════════════════
    def search_remotive(self, query: str, location: str = "", max_results: int = 15) -> List[Dict]:
        """Search Remotive.com for remote tech jobs (no API key needed).
        Note: Remotive search works best with individual keywords, not phrases.
        """
        jobs: List[Dict] = []
        seen_urls: set = set()
        try:
            # Remotive doesn't support phrase search — split and search key terms
            query_words = [w for w in query.lower().split() if len(w) > 2]
            search_terms = query_words[:2] if len(query_words) > 1 else query_words or ["developer"]

            for term in search_terms:
                url = "https://remotive.com/api/remote-jobs"
                params = {"search": term, "limit": min(max_results, 20)}
                logger.info(f"[Remotive] Searching: term={term}")
                resp = self.session.get(url, params=params, timeout=15)

                if resp.status_code != 200:
                    logger.warning(f"[Remotive] HTTP {resp.status_code}: {resp.text[:200]}")
                    continue

                data = resp.json()
                results = data.get("jobs", [])
                logger.info(f"[Remotive] Got {len(results)} results for '{term}'")

                for item in results:
                    job_url = item.get("url", "")
                    if job_url in seen_urls:
                        continue
                    seen_urls.add(job_url)

                    salary_str = str(item.get("salary", "")) if item.get("salary") else ""
                    job = {
                        "title": item.get("title", ""),
                        "company": item.get("company_name", "Unknown Company"),
                        "location": item.get("candidate_required_location") or "Remote",
                        "description": self._clean_html(item.get("description", "")),
                        "url": job_url,
                        "source": "Remotive",
                        "posted_date": self._format_date(item.get("publication_date", "")),
                        "salary": salary_str,
                        "job_type": item.get("job_type", "full_time").replace("_", " ").title(),
                        "keywords": item.get("tags", []),
                        "category": item.get("category", ""),
                    }
                    jobs.append(job)
                    if len(jobs) >= max_results:
                        return jobs

        except Exception as e:
            logger.error(f"[Remotive] Error: {e}")

        return jobs

    # ════════════════════════════════════════════════════════════
    #  2.  THE MUSE  (Tech + startup jobs, NO KEY)
    # ════════════════════════════════════════════════════════════
    def search_jobicy(self, query: str, location: str = "", max_results: int = 15) -> List[Dict]:
        """Search The Muse API for tech/startup jobs (no API key needed).
        Note: Method kept as search_jobicy for backward-compatibility with app.py callers.
        """
        jobs: List[Dict] = []
        try:
            url = "https://www.themuse.com/api/public/jobs"

            # Map query to a Muse category
            q_lower = query.lower()
            if "data" in q_lower and ("analyst" in q_lower or "scienc" in q_lower):
                category = "Data and Analytics"
            elif "design" in q_lower or "ui" in q_lower or "ux" in q_lower:
                category = "Design and UX"
            elif "devops" in q_lower or "sre" in q_lower or "cloud" in q_lower:
                category = "IT"
            elif "product" in q_lower and "manag" in q_lower:
                category = "Product"
            else:
                category = "Software Engineering"

            params = {"category": category, "page": 0, "descending": "true"}
            if location:
                params["location"] = location

            logger.info(f"[TheMuse] Searching: query={query} → category={category}")
            resp = self.session.get(url, params=params, timeout=15)

            if resp.status_code != 200:
                logger.warning(f"[TheMuse] HTTP {resp.status_code}: {resp.text[:200]}")
                return jobs

            data = resp.json()
            results = data.get("results", [])
            logger.info(f"[TheMuse] Got {len(results)} raw results")

            query_words = [w.lower() for w in query.split() if len(w) > 2]

            for item in results:
                title = item.get("name", "Untitled")
                company_info = item.get("company", {})
                company_name = company_info.get("name", "Unknown") if isinstance(company_info, dict) else str(company_info)

                # Relevance filter
                if query_words:
                    item_text = f"{title} {company_name}".lower()
                    if not any(w in item_text for w in query_words) and len(jobs) >= 3:
                        continue

                locs = item.get("locations", [])
                loc_str = locs[0].get("name", "Flexible") if locs else "Flexible"

                levels = item.get("levels", [])
                job_type = levels[0].get("name", "Full Level") if levels else "Full-time"

                refs = item.get("refs", {})
                job_url = refs.get("landing_page", "") if isinstance(refs, dict) else ""

                cats = item.get("categories", [])
                keywords = [c.get("name", "") for c in cats if isinstance(c, dict)]

                job = {
                    "title": title,
                    "company": company_name,
                    "location": loc_str,
                    "description": self._clean_html(item.get("contents", "") or ""),
                    "url": job_url,
                    "source": "TheMuse",
                    "posted_date": self._format_date(item.get("publication_date", "")),
                    "salary": "",
                    "job_type": job_type,
                    "keywords": keywords,
                    "category": category,
                }
                jobs.append(job)
                if len(jobs) >= max_results:
                    break

        except Exception as e:
            logger.error(f"[TheMuse] Error: {e}")

        return jobs

    # ════════════════════════════════════════════════════════════
    #  3.  ARBEITNOW.COM  (EU + Remote, NO KEY)
    # ════════════════════════════════════════════════════════════
    def search_arbeitnow(self, query: str, location: str = "", max_results: int = 15) -> List[Dict]:
        """Search Arbeitnow for EU and remote jobs (no API key needed)."""
        jobs: List[Dict] = []
        try:
            url = "https://www.arbeitnow.com/api/job-board-api"
            params = {}
            if query:
                params["search"] = query
            if location:
                params["location"] = location

            logger.info(f"[Arbeitnow] Searching: query={query}")
            resp = self.session.get(url, params=params, timeout=15)

            if resp.status_code != 200:
                logger.warning(f"[Arbeitnow] HTTP {resp.status_code}: {resp.text[:200]}")
                return jobs

            data = resp.json()
            results = data.get("data", [])
            logger.info(f"[Arbeitnow] Got {len(results)} raw results, filtering by query…")

            query_words = [w.lower() for w in query.split()] if query else []
            matched = []
            for item in results:
                title = item.get("title", "")
                desc = item.get("description", "")
                tags = [t.lower() for t in item.get("tags", [])]
                if query_words:
                    if not any(
                        w in title.lower() or w in desc.lower() or any(w in t for t in tags)
                        for w in query_words
                    ):
                        continue
                matched.append(item)
                if len(matched) >= max_results:
                    break

            logger.info(f"[Arbeitnow] {len(matched)} results after filtering")

            for item in matched:
                loc = item.get("location", "Remote")
                if item.get("remote"):
                    loc = "Remote" if not loc else f"{loc} / Remote"

                job = {
                    "title": item.get("title", "Untitled"),
                    "company": item.get("company_name", "Unknown Company"),
                    "location": loc,
                    "description": self._clean_html(item.get("description", "")),
                    "url": item.get("url", ""),
                    "source": "Arbeitnow",
                    "posted_date": self._format_date(str(item.get("created_at", ""))),
                    "salary": "",
                    "job_type": "Remote" if item.get("remote") else "On-site",
                    "keywords": item.get("tags", []),
                    "category": "",
                }
                jobs.append(job)

        except Exception as e:
            logger.error(f"[Arbeitnow] Error: {e}")

        return jobs

    # ════════════════════════════════════════════════════════════
    #  3.  USAJOBS.GOV  (US Government jobs)
    # ════════════════════════════════════════════════════════════
    def search_usajobs(self, query: str, location: str = "", max_results: int = 10) -> List[Dict]:
        """Search USAJobs.gov API for US government positions."""
        jobs: List[Dict] = []
        try:
            url = "https://data.usajobs.gov/api/Search"
            headers = {
                "Authorization-Key": USAJOBS_API_KEY,
                "User-Agent": USAJOBS_EMAIL,
                "Host": "data.usajobs.gov",
            }
            params = {
                "Keyword": query,
                "ResultsPerPage": min(max_results, 25),
            }
            if location:
                params["LocationName"] = location

            logger.info(f"[USAJobs] GET {url} | query={query}")
            resp = self.session.get(url, params=params, headers=headers, timeout=15)

            if resp.status_code != 200:
                logger.warning(f"[USAJobs] HTTP {resp.status_code}: {resp.text[:200]}")
                return jobs

            data = resp.json()
            search_result = data.get("SearchResult", {})
            items = search_result.get("SearchResultItems", [])
            logger.info(f"[USAJobs] Got {len(items)} results (total={search_result.get('SearchResultCount', 0)})")

            for item in items[:max_results]:
                match_item = item.get("MatchedObjectDescriptor", {})
                position_loc = match_item.get("PositionLocation", [])
                
                loc_str = ""
                if position_loc and isinstance(position_loc, list):
                    loc_str = position_loc[0].get("LocationName", "") if position_loc else ""

                # Salary
                salary_str = ""
                pos_remuneration = match_item.get("PositionRemuneration", [])
                if pos_remuneration and isinstance(pos_remuneration, list):
                    rem = pos_remuneration[0] if pos_remuneration else {}
                    min_range = rem.get("MinimumRange", "")
                    max_range = rem.get("MaximumRange", "")
                    if min_range and max_range:
                        try:
                            salary_str = f"${int(float(min_range)):,} - ${int(float(max_range)):,}/yr"
                        except:
                            salary_str = f"${min_range} - ${max_range}"

                # Job schedule (Full-Time, Part-Time, etc.)
                schedule = match_item.get("PositionSchedule", [])
                job_type = ""
                if schedule and isinstance(schedule, list):
                    job_type = schedule[0].get("Name", "Full-Time") if schedule else "Full-Time"

                job = {
                    "title": match_item.get("PositionTitle", "Untitled"),
                    "company": match_item.get("OrganizationName", "US Government"),
                    "location": loc_str or "United States",
                    "description": self._clean_html(match_item.get("QualificationSummary", "") or match_item.get("UserArea", {}).get("Details", {}).get("MajorDuties", [""])[0] if isinstance(match_item.get("UserArea", {}).get("Details", {}).get("MajorDuties"), list) else ""),
                    "url": match_item.get("PositionURI", "") or match_item.get("ApplyURI", [""])[0] if isinstance(match_item.get("ApplyURI"), list) else match_item.get("PositionURI", ""),
                    "source": "USAJobs",
                    "posted_date": self._format_date(match_item.get("PublicationStartDate", "")),
                    "salary": salary_str,
                    "job_type": job_type or "Full-Time",
                    "department": match_item.get("DepartmentName", ""),
                }
                
                # Fix URL extraction
                apply_uri = match_item.get("ApplyURI")
                position_uri = match_item.get("PositionURI", "")
                if isinstance(apply_uri, list) and apply_uri:
                    job["url"] = apply_uri[0]
                elif position_uri:
                    job["url"] = position_uri
                    
                jobs.append(job)

        except Exception as e:
            logger.error(f"[USAJobs] Error: {e}")

        return jobs

    # ════════════════════════════════════════════════════════════
    #  UNIFIED SEARCH  (all 4 platforms at once)
    # ════════════════════════════════════════════════════════════
    def search_all(self, query: str, location: str = "", max_per_platform: int = 10) -> Dict:
        """Search all 4 APIs and return combined results."""
        logger.info(f"\n{'='*60}")
        logger.info(f"[JobAPIScraper] Searching ALL platforms for: '{query}'")
        logger.info(f"{'='*60}")

        remotive_jobs  = self.search_remotive(query, location, max_per_platform)
        themuse_jobs   = self.search_jobicy(query, location, max_per_platform)
        arbeitnow_jobs = self.search_arbeitnow(query, location, max_per_platform)
        usajobs_jobs   = self.search_usajobs(query, location, max_per_platform)

        all_jobs = remotive_jobs + themuse_jobs + arbeitnow_jobs + usajobs_jobs

        logger.info(f"\n[JobAPIScraper] Results Summary:")
        logger.info(f"  Remotive:  {len(remotive_jobs)} jobs")
        logger.info(f"  TheMuse:   {len(themuse_jobs)} jobs")
        logger.info(f"  Arbeitnow: {len(arbeitnow_jobs)} jobs")
        logger.info(f"  USAJobs:   {len(usajobs_jobs)} jobs")
        logger.info(f"  TOTAL:     {len(all_jobs)} jobs")

        return {
            "allJobs": all_jobs,
            "jobsByPlatform": {
                "remotive":  remotive_jobs,
                "themuse":   themuse_jobs,
                "arbeitnow": arbeitnow_jobs,
                "usajobs":   usajobs_jobs,
            },
            "statistics": {
                "total_jobs": len(all_jobs),
                "platforms_scraped": ["Remotive", "TheMuse", "Arbeitnow", "USAJobs"],
                "jobs_per_platform": {
                    "remotive":  len(remotive_jobs),
                    "themuse":   len(themuse_jobs),
                    "arbeitnow": len(arbeitnow_jobs),
                    "usajobs":   len(usajobs_jobs),
                },
            },
        }

    # ════════════════════════════════════════════════════════════
    #  HELPERS
    # ════════════════════════════════════════════════════════════
    def _clean_html(self, text: str) -> str:
        """Strip basic HTML tags from text."""
        if not text:
            return ""
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        text = (text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
                    .replace("&quot;", '"').replace("&#39;", "'").replace("&nbsp;", " "))
        return text[:1000]

    def _format_date(self, date_str: str) -> str:
        """Format various date strings to readable format."""
        if not date_str:
            return "Recently"
        try:
            for fmt in ["%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"]:
                try:
                    dt = datetime.strptime(date_str[:19], fmt[:len(date_str[:19])+2])
                    days_ago = (datetime.now() - dt).days
                    if days_ago == 0:
                        return "Today"
                    elif days_ago == 1:
                        return "Yesterday"
                    elif days_ago < 7:
                        return f"{days_ago} days ago"
                    elif days_ago < 30:
                        weeks = days_ago // 7
                        return f"{weeks} week{'s' if weeks > 1 else ''} ago"
                    else:
                        return dt.strftime("%b %d, %Y")
                except ValueError:
                    continue
        except Exception:
            pass
        return date_str[:10] if len(date_str) > 10 else date_str


# ─── Quick test ───────────────────────────────────────────────
if __name__ == "__main__":
    scraper = JobAPIScraper()
    results = scraper.search_all("Python Developer", "", max_per_platform=5)
    print(f"\nTotal jobs found: {len(results['allJobs'])}")
    for job in results["allJobs"][:10]:
        print(f"  [{job['source']}] {job['title']} at {job['company']} — {job['location']}")
        if job.get("salary"):
            print(f"    Salary: {job['salary']}")
