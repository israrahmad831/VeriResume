# -*- coding: utf-8 -*-
"""
VeriResume - Fast HTTP Job Scraper for Indeed Pakistan and Rozee.pk
Uses requests + BeautifulSoup instead of Selenium for 10x faster scraping.

Platforms:
  - Indeed Pakistan  (pk.indeed.com)
  - Rozee.pk         (www.rozee.pk)

Technique: Direct HTTP GET with parsed HTML (no browser needed)
Typical speed: 3-8 seconds total vs 30-60+ seconds with Selenium
"""

import logging
import re
import urllib.parse
from typing import List, Dict

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Common headers to mimic a real browser
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}


class FastJobScraper:
    """HTTP-based job scraper — no Selenium, no Chrome, no waits."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        logger.info("[FastScraper] Initialized (HTTP-based, no browser)")

    # ────────────────────────────────────────────────────────────
    #  Indeed Pakistan  (pk.indeed.com)
    # ────────────────────────────────────────────────────────────
    def scrape_indeed(
        self, job_title: str, location: str = "Pakistan", max_results: int = 10
    ) -> List[Dict]:
        """Scrape Indeed PK search results via HTTP GET."""
        jobs: List[Dict] = []
        try:
            query = urllib.parse.quote_plus(job_title)
            loc = urllib.parse.quote_plus(location)
            url = f"https://pk.indeed.com/jobs?q={query}&l={loc}"
            logger.info(f"[Indeed] GET {url}")

            resp = self.session.get(url, timeout=15)
            if resp.status_code != 200:
                logger.warning(f"[Indeed] HTTP {resp.status_code}")
                return jobs

            soup = BeautifulSoup(resp.text, "html.parser")

            # Indeed job cards are in <div class="job_seen_beacon"> or
            # <div class="jobsearch-ResultsList"> > li > div
            cards = soup.select('div.job_seen_beacon')
            if not cards:
                # Fallback: try mosaic cards
                cards = soup.select('li div.cardOutline')
            if not cards:
                # Another fallback
                cards = soup.select('div.resultContent')
            if not cards:
                # Try the broadest selector
                cards = soup.select('td.resultContent')

            logger.info(f"[Indeed] Found {len(cards)} job cards")

            for card in cards[:max_results]:
                try:
                    # ── Title ──
                    title_el = (
                        card.select_one('h2.jobTitle a span') or
                        card.select_one('h2.jobTitle span') or
                        card.select_one('h2 a') or
                        card.select_one('a.jcs-JobTitle span') or
                        card.select_one('h2')
                    )
                    title = title_el.get_text(strip=True) if title_el else ""
                    if not title:
                        continue

                    # ── URL ──
                    link_el = (
                        card.select_one('h2.jobTitle a') or
                        card.select_one('a.jcs-JobTitle') or
                        card.select_one('h2 a')
                    )
                    href = link_el.get("href", "") if link_el else ""
                    if href and not href.startswith("http"):
                        href = "https://pk.indeed.com" + href
                    job_url = href or "https://pk.indeed.com"

                    # ── Company ──
                    comp_el = (
                        card.select_one('[data-testid="company-name"]') or
                        card.select_one('span.companyName') or
                        card.select_one('span.company')
                    )
                    company = comp_el.get_text(strip=True) if comp_el else "Unknown Company"

                    # ── Location ──
                    loc_el = (
                        card.select_one('[data-testid="text-location"]') or
                        card.select_one('div.companyLocation') or
                        card.select_one('span.companyLocation')
                    )
                    job_location = loc_el.get_text(strip=True) if loc_el else location

                    # ── Description snippet ──
                    desc_el = (
                        card.select_one('div.job-snippet') or
                        card.select_one('div.heading6') or
                        card.select_one('table td.snip') or
                        card.select_one('ul') or
                        card.select_one('div.metadata')
                    )
                    snippet = desc_el.get_text(" ", strip=True) if desc_el else ""

                    # Build a rich description combining title + snippet
                    description = f"{title}. {snippet}".strip() if snippet else title

                    # ── Salary (if available) ──
                    salary_el = card.select_one('div.salary-snippet-container') or card.select_one('span.salary-snippet')
                    salary = salary_el.get_text(strip=True) if salary_el else ""

                    # ── Easy Apply ──
                    easy_apply = bool(card.select_one('.iaLabel') or card.select_one('[aria-label*="apply"]'))

                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "description": description,
                        "source": "indeed",
                        "url": job_url,
                        "posted_date": "Recently",
                        "salary": salary,
                        "easy_apply": easy_apply,
                    })
                    logger.info(f"  [Indeed] {title} @ {company}")

                except Exception as inner:
                    logger.debug(f"  [Indeed] Card parse error: {inner}")
                    continue

            logger.info(f"[Indeed] Scraped {len(jobs)} jobs")
        except requests.exceptions.RequestException as e:
            logger.error(f"[Indeed] Request error: {e}")
        except Exception as e:
            logger.error(f"[Indeed] Error: {e}")
        return jobs

    # ────────────────────────────────────────────────────────────
    #  Rozee.pk
    # ────────────────────────────────────────────────────────────
    def scrape_rozee(
        self, job_title: str, location: str = "Pakistan", max_results: int = 10
    ) -> List[Dict]:
        """Scrape Rozee.pk search results via HTTP GET."""
        jobs: List[Dict] = []
        try:
            query = urllib.parse.quote_plus(job_title)
            url = f"https://www.rozee.pk/job/search/q/{query}"
            logger.info(f"[Rozee] GET {url}")

            resp = self.session.get(url, timeout=15)
            if resp.status_code != 200:
                logger.warning(f"[Rozee] HTTP {resp.status_code}")
                return jobs

            soup = BeautifulSoup(resp.text, "html.parser")

            # Rozee job cards
            cards = soup.select('div.job')
            if not cards:
                cards = soup.select('div.jobb')
            if not cards:
                # Try broader selector
                cards = soup.select('#jobs > div')
            if not cards:
                cards = soup.select('div[class*="job"]')

            logger.info(f"[Rozee] Found {len(cards)} job cards")

            for card in cards[:max_results]:
                try:
                    # ── Title ──
                    title_el = (
                        card.select_one('h3 a bdi') or
                        card.select_one('h3 a') or
                        card.select_one('a.jt') or
                        card.select_one('h3')
                    )
                    title = title_el.get_text(strip=True) if title_el else ""
                    if not title:
                        continue

                    # ── URL ──
                    link_el = card.select_one('h3 a') or card.select_one('a.jt') or card.select_one('a')
                    href = link_el.get("href", "") if link_el else ""
                    if href and not href.startswith("http"):
                        href = "https://www.rozee.pk" + href
                    job_url = href or "https://www.rozee.pk"

                    # ── Company ──
                    comp_el = (
                        card.select_one('bdi a:first-of-type') or
                        card.select_one('div.cname a') or
                        card.select_one('span.cname') or
                        card.select_one('a.cn')
                    )
                    company = comp_el.get_text(strip=True) if comp_el else "Unknown Company"

                    # ── Location ──
                    loc_el = (
                        card.select_one('bdi a:nth-of-type(2)') or
                        card.select_one('span.loc') or
                        card.select_one('div.loc')
                    )
                    job_location = loc_el.get_text(strip=True) if loc_el else location

                    # ── Description / Skills snippet ──
                    desc_el = (
                        card.select_one('div.jd') or
                        card.select_one('div.job-description') or
                        card.select_one('p')
                    )
                    snippet = desc_el.get_text(" ", strip=True) if desc_el else ""

                    # Try to also get skills tags
                    skill_tags = card.select('span.skill-tag, span.stag, a.stag')
                    skills_text = ", ".join(t.get_text(strip=True) for t in skill_tags)

                    # Build rich description
                    parts = [title]
                    if snippet:
                        parts.append(snippet)
                    if skills_text:
                        parts.append(f"Skills: {skills_text}")
                    description = ". ".join(parts)

                    # ── Experience ──
                    exp_el = card.select_one('span.exp') or card.select_one('div.exp')
                    experience = exp_el.get_text(strip=True) if exp_el else ""

                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "description": description,
                        "source": "rozee",
                        "url": job_url,
                        "posted_date": "Recently",
                        "experience": experience,
                    })
                    logger.info(f"  [Rozee] {title} @ {company}")

                except Exception as inner:
                    logger.debug(f"  [Rozee] Card parse error: {inner}")
                    continue

            logger.info(f"[Rozee] Scraped {len(jobs)} jobs")
        except requests.exceptions.RequestException as e:
            logger.error(f"[Rozee] Request error: {e}")
        except Exception as e:
            logger.error(f"[Rozee] Error: {e}")
        return jobs

    # ────────────────────────────────────────────────────────────
    #  Unified search (both platforms in parallel-ish)
    # ────────────────────────────────────────────────────────────
    def search_jobs(
        self,
        job_title: str,
        location: str = "Pakistan",
        max_per_platform: int = 10,
    ) -> Dict:
        """Search both platforms and return combined results."""
        all_jobs: List[Dict] = []
        by_platform: Dict[str, list] = {}

        # Indeed
        indeed = self.scrape_indeed(job_title, location, max_per_platform)
        all_jobs.extend(indeed)
        by_platform["indeed"] = indeed

        # Rozee
        rozee = self.scrape_rozee(job_title, location, max_per_platform)
        all_jobs.extend(rozee)
        by_platform["rozee"] = rozee

        logger.info(
            f"[search_jobs] Total {len(all_jobs)} jobs "
            f"(Indeed={len(indeed)}, Rozee={len(rozee)})"
        )

        return {
            "allJobs": all_jobs,
            "jobsByPlatform": by_platform,
            "statistics": {
                "total_jobs": len(all_jobs),
                "platforms_scraped": [
                    p for p in ["indeed", "rozee"] if by_platform.get(p)
                ],
                "jobs_per_platform": {
                    p: len(j) for p, j in by_platform.items()
                },
            },
        }
