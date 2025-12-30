import httpx
import asyncio
from bs4 import BeautifulSoup
import re
import json
from urllib.parse import urlparse

# Global client for connection pooling
async_client = httpx.AsyncClient(
    timeout=httpx.Timeout(15.0),
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    },
    follow_redirects=True
)

async def scrape_job_details(url):
    """
    Next Level: Asynchronous Scraper for high-performance job extraction.
    """
    try:
        response = await async_client.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # --- Attempt 1: Title ---
        title = "Unknown Job Title"
        h1 = soup.find('h1')
        if h1:
            title = h1.get_text(strip=True)
        elif soup.title:
            title = soup.title.get_text(strip=True)
        
        # --- Attempt 2: Company ---
        company = "Unknown Company"
        
        # Strategy A: JSON-LD
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    if data.get('@type') == 'JobPosting' and 'hiringOrganization' in data:
                        org = data['hiringOrganization']
                        company = org.get('name') if isinstance(org, dict) else org
                        break
            except: continue
                
        # Strategy B: Site/Domain Fallbacks
        if company == "Unknown Company":
            og_site = soup.find('meta', property='og:site_name')
            if og_site:
                company = og_site.get('content')
            else:
                domain = urlparse(url).netloc
                company = domain.replace('www.', '').split('.')[0].capitalize()

        # Job Board Refinement
        job_boards = ['linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter']
        if any(jb in company.lower() for jb in job_boards):
            page_title = soup.title.get_text(strip=True) if soup.title else ""
            if " at " in page_title:
                company = page_title.split(" at ")[1].split('|')[0].split('-')[0].strip()
            elif " | " in page_title:
                parts = page_title.split(" | ")
                if len(parts) >= 2: company = parts[1].strip()

        # --- Attempt 3: Description (Next Level Selectors) ---
        description = ""
        site_selectors = [
            '.show-more-less-html__markup', 
            '.jobsearch-jobDescriptionText',
            '#jobDescriptionText',
            '.jobDescriptionContent'
        ]
        
        for sel in site_selectors:
            node = soup.select_one(sel)
            if node:
                description = node.get_text(" ", strip=True)
                break
        
        if not description:
            target_keywords = re.compile(r'job[-_]?description|details|content|body', re.IGNORECASE)
            candidates = soup.find_all(['div', 'section', 'article', 'main'], class_=target_keywords)
            if candidates:
                best_node = max(candidates, key=lambda tag: len(tag.get_text()))
                description = best_node.get_text(" ", strip=True)
            else:
                for script in soup(["script", "style", "nav", "header", "footer"]):
                    script.decompose()
                description = soup.get_text(" ", strip=True)
            
        description = re.sub(r'\s+', ' ', description).strip()

        # --- Attempt 4: Location ---
        location = "Remote / Not Specified"
        loc_meta = soup.find("meta", property="og:locality") or soup.find("meta", attrs={"name": "geo.placename"})
        if loc_meta:
            location = loc_meta.get("content")
        else:
            li_loc = soup.find('span', class_='topcard__dot-recolor') or soup.find('span', class_=re.compile(r'location', re.I))
            if li_loc: location = li_loc.get_text(strip=True)

        if len(description) < 50:
            return {"error": "Insufficient text extracted (Anti-bot likely active)."}

        return {
            "title": title,
            "company": company,
            "description": description,
            "location": location
        }

    except Exception as e:
        return {"error": f"Network Speed Bottleneck: {str(e)}"}
