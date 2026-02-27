# -*- coding: utf-8 -*-
"""
VeriResume - Selenium Job Scraper for Indeed Pakistan and Rozee.pk
Uses Selenium WebDriver with the user's exact XPaths.

Platforms:
  - Indeed Pakistan  (pk.indeed.com)
  - Rozee.pk         (www.rozee.pk)
"""

import time
import logging
from typing import List, Dict, Optional

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    WebDriverException,
)

try:
    from webdriver_manager.chrome import ChromeDriverManager
    HAS_MANAGER = True
except ImportError:
    HAS_MANAGER = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JobScraper:
    """Selenium-based scraper for Indeed PK & Rozee.pk"""

    def __init__(self, headless: bool = True):
        self.headless = headless
        self.driver = None
        logger.info("[JobScraper] Initialized (driver created per search)")

    # ------------------------------------------------------------------ #
    #  Chrome Driver helpers
    # ------------------------------------------------------------------ #
    def _create_driver(self):
        """Create a fresh ChromeDriver instance."""
        opts = Options()
        if self.headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1920,1080")
        opts.add_argument("--disable-blink-features=AutomationControlled")
        opts.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])

        if HAS_MANAGER:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=opts)
        else:
            self.driver = webdriver.Chrome(options=opts)

        self.driver.implicitly_wait(5)
        logger.info("[JobScraper] ChromeDriver started")

    def _close_driver(self):
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
                logger.info("[JobScraper] ChromeDriver closed")
        except Exception:
            pass

    # ------------------------------------------------------------------ #
    #  Indeed Pakistan  (pk.indeed.com)
    #  User-provided XPaths:
    #  - Search: //*[@id="text-input-what"]  (job title)
    #  - Search: //*[@id="text-input-where"] (location)
    #  - Button: //*[@id="jobsearch"]/div/div[2]/button/span
    #  - Job cards in mosaic list:
    #      li[2]=job1, li[3]=job2, li[4]=job3, li[5]=job4, li[6]=job5
    #  - Title: //*[@id="sj_<id>"] or //*[@id="job_<id>"]
    #  - Company: .../li[N]/.../table/tbody/tr/td/div[2]/div[1]/div[2]/div[1]
    #             or .../li[N]/.../table/tbody/tr/td/div[2]/div[1]/div/div[1]
    #  - Location: .../li[N]/.../table/tbody/tr/td/div[2]/div[1]/div[2]/div[2]
    #              or .../li[N]/.../table/tbody/tr/td/div[2]/div[1]/div/div[2]
    # ------------------------------------------------------------------ #
    def scrape_indeed(
        self, job_title: str, location: str = "Pakistan", max_results: int = 5
    ) -> List[Dict]:
        """Scrape Indeed PK using the user's exact XPaths."""
        jobs: List[Dict] = []
        try:
            logger.info(f"[Indeed] Searching: '{job_title}' in '{location}'")
            self.driver.get("https://pk.indeed.com/")
            time.sleep(3)

            # --- Fill search form ---
            # Job title input: //*[@id="text-input-what"]
            job_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located(
                    (By.XPATH, '//*[@id="text-input-what"]')
                )
            )
            job_input.clear()
            job_input.send_keys(job_title)

            # Location input: //*[@id="text-input-where"]
            loc_input = self.driver.find_element(
                By.XPATH, '//*[@id="text-input-where"]'
            )
            loc_input.clear()
            loc_input.send_keys(location)

            # Click "Find jobs": //*[@id="jobsearch"]/div/div[2]/button/span
            find_btn = self.driver.find_element(
                By.XPATH, '//*[@id="jobsearch"]/div/div[2]/button/span'
            )
            find_btn.click()
            logger.info("[Indeed] Clicked Find Jobs")
            time.sleep(5)

            # --- Scrape result cards ---
            # Job cards live inside: //*[@id="mosaic-provider-jobcards"]/div/ul/li[N]
            # li[2] = job 1, li[3] = job 2, etc. (li[1] may be header/ad)
            mosaic_base = '//*[@id="mosaic-provider-jobcards"]/div/ul'

            for li_idx in range(2, 2 + max_results):
                try:
                    li_base = f'{mosaic_base}/li[{li_idx}]'

                    # ---- Job Title ----
                    # Try multiple patterns: the title is usually an <a> with id like
                    # "sj_xxx" or "job_xxx", inside the li.
                    title = ""
                    url = ""

                    # Pattern 1: look for any <a> whose id starts with "job_" or "sj_"
                    title_selectors = [
                        f'{li_base}//a[starts-with(@id,"job_")]',
                        f'{li_base}//a[starts-with(@id,"sj_")]',
                        f'{li_base}//h2//a',
                        f'{li_base}//h2//span',
                    ]
                    for sel in title_selectors:
                        try:
                            el = self.driver.find_element(By.XPATH, sel)
                            title = el.text.strip()
                            url = el.get_attribute("href") or ""
                            if title:
                                break
                        except NoSuchElementException:
                            continue

                    if not title:
                        logger.debug(f"  [Indeed] li[{li_idx}] no title found, skipping")
                        continue

                    # ---- Company Name ----
                    company = ""
                    company_selectors = [
                        # User pattern 1: .../div[2]/div[1]/div[2]/div[1]
                        f'{li_base}/div/div/div/div/div/div/table/tbody/tr/td/div[2]/div[1]/div[2]/div[1]',
                        # User pattern 2: .../div[2]/div[1]/div/div[1]
                        f'{li_base}/div/div/div/div/div/div/table/tbody/tr/td/div[2]/div[1]/div/div[1]',
                        # Fallback: look for data-testid="company-name"
                        f'{li_base}//*[@data-testid="company-name"]',
                        # Fallback: look for class containing "company"
                        f'{li_base}//span[contains(@class,"company")]',
                    ]
                    for sel in company_selectors:
                        try:
                            el = self.driver.find_element(By.XPATH, sel)
                            company = el.text.strip()
                            if company:
                                break
                        except NoSuchElementException:
                            continue

                    if not company:
                        company = "Unknown Company"

                    # ---- Location ----
                    job_location = ""
                    location_selectors = [
                        # User pattern 1: .../div[2]/div[1]/div[2]/div[2]
                        f'{li_base}/div/div/div/div/div/div/table/tbody/tr/td/div[2]/div[1]/div[2]/div[2]',
                        # User pattern 2: .../div[2]/div[1]/div/div[2]
                        f'{li_base}/div/div/div/div/div/div/table/tbody/tr/td/div[2]/div[1]/div/div[2]',
                        # Fallback: data-testid="text-location"
                        f'{li_base}//*[@data-testid="text-location"]',
                    ]
                    for sel in location_selectors:
                        try:
                            el = self.driver.find_element(By.XPATH, sel)
                            job_location = el.text.strip()
                            if job_location:
                                break
                        except NoSuchElementException:
                            continue

                    if not job_location:
                        job_location = location

                    # ---- Easy Apply badge ----
                    easy_apply = False
                    apply_selectors = [
                        f'{li_base}/div/div/div/div/div/div/table/tbody/tr/td/div[2]/div[3]/div[1]/span',
                        f'{li_base}/div/div/div/div/div/div/table/tbody/tr/td/div[2]/div[3]/div[1]',
                    ]
                    for sel in apply_selectors:
                        try:
                            el = self.driver.find_element(By.XPATH, sel)
                            text = el.text.strip().lower()
                            if "apply" in text or "easily" in text:
                                easy_apply = True
                                break
                        except NoSuchElementException:
                            continue

                    if not url:
                        url = "https://pk.indeed.com"

                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "description": f"{title} at {company} - {job_location}",
                        "source": "indeed",
                        "url": url,
                        "posted_date": "Recently",
                        "easy_apply": easy_apply,
                    })
                    logger.info(f"  [Indeed] {title} @ {company} ({job_location})")

                except Exception as inner:
                    logger.debug(f"  [Indeed] li[{li_idx}] error: {inner}")
                    continue

            logger.info(f"[Indeed] Scraped {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"[Indeed] Error: {e}")
        return jobs

    # ------------------------------------------------------------------ #
    #  Rozee.pk
    #  User-provided XPaths:
    #  - Search: //*[@id="search"]  (job title)
    #  - Location: //*[@id="search_form"]/div[2]/div/button/span[1]
    #  - Button: //*[@id="search_form"]/div[4]/button
    #  - Job cards at //*[@id="jobs"]/div[N]:
    #      div[4]=job1, div[5]=job2, div[6]=job3, div[7]=job4, div[8]=job5
    #  - Title:   .../div[N]/div[1]/div[1]/div/h3/a/bdi
    #  - Company: .../div[N]/div[1]/div[1]/div/div/bdi/a[1]
    #  - Location:.../div[N]/div[1]/div[1]/div/div/bdi/a[2]
    #             or text() node for location
    # ------------------------------------------------------------------ #
    def scrape_rozee(
        self, job_title: str, location: str = "Pakistan", max_results: int = 5
    ) -> List[Dict]:
        """Scrape Rozee.pk using the user's exact XPaths."""
        jobs: List[Dict] = []
        try:
            logger.info(f"[Rozee] Searching: '{job_title}' in '{location}'")
            self.driver.get("https://www.rozee.pk/")
            time.sleep(3)

            # --- Fill search form ---
            # Job title: //*[@id="search"]
            search_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located(
                    (By.XPATH, '//*[@id="search"]')
                )
            )
            search_input.clear()
            search_input.send_keys(job_title)

            # Location dropdown: //*[@id="search_form"]/div[2]/div/button/span[1]
            try:
                loc_btn = self.driver.find_element(
                    By.XPATH,
                    '//*[@id="search_form"]/div[2]/div/button/span[1]',
                )
                loc_btn.click()
                time.sleep(1)
                # Try to select matching location from dropdown
                if location and location.lower() != "pakistan":
                    try:
                        loc_option = self.driver.find_element(
                            By.XPATH,
                            f'//a[contains(translate(text(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"{location.lower()}")]'
                        )
                        loc_option.click()
                        time.sleep(0.5)
                    except NoSuchElementException:
                        # Click elsewhere to close dropdown
                        self.driver.find_element(By.TAG_NAME, "body").click()
                        time.sleep(0.3)
            except Exception:
                pass

            # Click Search: //*[@id="search_form"]/div[4]/button
            search_btn = self.driver.find_element(
                By.XPATH, '//*[@id="search_form"]/div[4]/button'
            )
            search_btn.click()
            logger.info("[Rozee] Clicked Search")
            time.sleep(5)

            # --- Scrape result cards ---
            # Results start at div[4] per user XPaths:
            #   div[4]=job1, div[5]=job2, etc.
            for div_idx in range(4, 4 + max_results):
                try:
                    base = f'//*[@id="jobs"]/div[{div_idx}]'

                    # ---- Job Title ----
                    # //*[@id="jobs"]/div[N]/div[1]/div[1]/div/h3/a/bdi
                    title = ""
                    url = ""
                    title_xpath = f"{base}/div[1]/div[1]/div/h3/a/bdi"
                    try:
                        title_el = self.driver.find_element(By.XPATH, title_xpath)
                        title = title_el.text.strip()
                    except NoSuchElementException:
                        # Fallback: try without /bdi
                        try:
                            title_el = self.driver.find_element(By.XPATH, f"{base}/div[1]/div[1]/div/h3/a")
                            title = title_el.text.strip()
                        except NoSuchElementException:
                            logger.debug(f"  [Rozee] div[{div_idx}] no title found, skipping")
                            continue

                    if not title:
                        continue

                    # Get URL from the title link
                    try:
                        link_el = self.driver.find_element(
                            By.XPATH, f"{base}/div[1]/div[1]/div/h3/a"
                        )
                        url = link_el.get_attribute("href") or "https://www.rozee.pk"
                    except NoSuchElementException:
                        url = "https://www.rozee.pk"

                    # ---- Company Name ----
                    # //*[@id="jobs"]/div[N]/div[1]/div[1]/div/div/bdi/a[1]
                    company = ""
                    comp_xpath = f"{base}/div[1]/div[1]/div/div/bdi/a[1]"
                    try:
                        comp_el = self.driver.find_element(By.XPATH, comp_xpath)
                        company = comp_el.text.strip()
                    except NoSuchElementException:
                        company = "Unknown Company"

                    # ---- Location ----
                    # //*[@id="jobs"]/div[N]/div[1]/div[1]/div/div/bdi/a[2]
                    # Sometimes it's text() instead of a[2]
                    job_location = ""
                    loc_selectors = [
                        f"{base}/div[1]/div[1]/div/div/bdi/a[2]",
                    ]
                    for sel in loc_selectors:
                        try:
                            loc_el = self.driver.find_element(By.XPATH, sel)
                            job_location = loc_el.text.strip()
                            if job_location:
                                break
                        except NoSuchElementException:
                            continue

                    # Fallback: try to get text from bdi parent
                    if not job_location:
                        try:
                            bdi_el = self.driver.find_element(
                                By.XPATH, f"{base}/div[1]/div[1]/div/div/bdi"
                            )
                            bdi_text = bdi_el.text.strip()
                            # The bdi text contains "CompanyName Location"
                            # Location is the part after company name
                            if company and company in bdi_text:
                                remainder = bdi_text.replace(company, "").strip(" -·,")
                                if remainder:
                                    job_location = remainder
                        except NoSuchElementException:
                            pass

                    if not job_location:
                        job_location = location

                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "description": f"{title} at {company} - {job_location}",
                        "source": "rozee",
                        "url": url,
                        "posted_date": "Recently",
                    })
                    logger.info(f"  [Rozee] {title} @ {company} ({job_location})")

                except Exception as inner:
                    logger.debug(f"  [Rozee] div[{div_idx}] error: {inner}")
                    continue

            logger.info(f"[Rozee] Scraped {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"[Rozee] Error: {e}")
        return jobs

    # ------------------------------------------------------------------ #
    #  Unified search
    # ------------------------------------------------------------------ #
    def search_jobs(
        self,
        job_title: str,
        location: str = "Pakistan",
        max_per_platform: int = 5,
    ) -> Dict:
        """Search both platforms and return combined results."""
        all_jobs: List[Dict] = []
        by_platform: Dict[str, list] = {}

        try:
            self._create_driver()

            # Indeed
            indeed = self.scrape_indeed(job_title, location, max_per_platform)
            all_jobs.extend(indeed)
            by_platform["indeed"] = indeed

            time.sleep(2)

            # Rozee
            rozee = self.scrape_rozee(job_title, location, max_per_platform)
            all_jobs.extend(rozee)
            by_platform["rozee"] = rozee

        except Exception as e:
            logger.error(f"[search_jobs] {e}")
        finally:
            self._close_driver()

        logger.info(
            f"[search_jobs] Total {len(all_jobs)} jobs "
            f"(Indeed={len(by_platform.get('indeed', []))}, "
            f"Rozee={len(by_platform.get('rozee', []))})"
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
