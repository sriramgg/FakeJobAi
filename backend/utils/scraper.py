import requests
from bs4 import BeautifulSoup
import re

def scrape_job_details(url):
    """
    Scrapes a given URL to extract job title, company, and description.
    This is a generic scraper and might need adjustments for specific sites (LinkedIn, Indeed, etc.).
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0"
        }
        
        session = requests.Session()
        session.headers.update(headers)
        response = session.get(url, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # --- Attempt 1: Title ---
        title = "Unknown Job Title"
        # Try h1
        h1 = soup.find('h1')
        if h1:
            title = h1.get_text(strip=True)
        else:
            # Try title tag as fallback
            if soup.title:
                title = soup.title.get_text(strip=True)
        
        # --- Attempt 2: Company ---
        company = "Unknown Company"
        
        # Strategy A: Check Schema.org JSON-LD for "hiringOrganization"
        import json
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    # Check for JobPosting type
                    if data.get('@type') == 'JobPosting' and 'hiringOrganization' in data:
                        org = data['hiringOrganization']
                        if isinstance(org, dict) and 'name' in org:
                            company = org['name']
                            break
                        elif isinstance(org, str):
                            company = org
                            break
            except:
                continue
                
        # Strategy B: OpenGraph site name (if A failed)
        if company == "Unknown Company":
            og_site = soup.find('meta', property='og:site_name')
            if og_site and og_site.get('content'):
                company = og_site.get('content')
                
        # Strategy C: Domain name as fallback
        if company == "Unknown Company":
            from urllib.parse import urlparse
            domain = urlparse(url).netloc
            company = domain.replace('www.', '').split('.')[0].capitalize()

        # Strategy D: Refinement for Job Boards (fix "LinkedIn", "Indeed" etc. as company name)
        # If the detected company is just the platform, we dig deeper into the Page Title
        job_boards = ['linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter']
        if company.lower() in job_boards or "linkedin" in company.lower():
            page_title = soup.title.get_text(strip=True) if soup.title else ""
            
            # Pattern 1: "Job Title at Company" (Common on LinkedIn)
            if " at " in page_title:
                parts = page_title.split(" at ")
                if len(parts) > 1:
                    # Take part after ' at ' and clean up trailing | or -
                    candidate = parts[1].split('|')[0].split('-')[0].strip()
                    if candidate:
                        company = candidate
            
            # Pattern 2: "Job Title | Company | Location"
            elif " | " in page_title:
                parts = page_title.split(" | ")
                if len(parts) >= 2:
                    # Often 2nd part is company
                    candidate = parts[1].strip()
                    if len(candidate) > 2: # valid check
                        company = candidate

            # Pattern 3: LinkedIn specific HTML class (if available in public view)
            li_org = soup.find('a', class_='topcard__org-name-link')
            if li_org:
                company = li_org.get_text(strip=True)

        # --- Attempt 3: Description ---
        description = ""
        # Heuristic: Find div/section with 'description' in class or id
        target_keywords = re.compile(r'job[-_]?description|details|content|body', re.IGNORECASE)
        candidates = soup.find_all(['div', 'section', 'article', 'main'], class_=target_keywords)
        
        if not candidates:
            # secondary check on ID
            candidates = soup.find_all(['div', 'section', 'article', 'main'], id=target_keywords)

        if candidates:
            # Pick the one with the most text length to be safe
            best_node = max(candidates, key=lambda tag: len(tag.get_text()))
            description = best_node.get_text(" ", strip=True)
        else:
            # Final Fallback: Grab all text from the body, excluding scripts/styles
            for script in soup(["script", "style", "nav", "header", "footer"]):
                script.decompose()
            description = soup.get_text(" ", strip=True)
            
        # Clean up whitespace
        description = re.sub(r'\s+', ' ', description).strip()

        # --- Attempt 4: Location (Enhanced) ---
        location = "Unknown"
        # Strategy A: Check JSON-LD
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'JobPosting':
                    if 'jobLocation' in data and 'address' in data['jobLocation']:
                        addr = data['jobLocation']['address']
                        if isinstance(addr, dict):
                             parts = []
                             if addr.get('addressLocality'): parts.append(addr['addressLocality'])
                             if addr.get('addressRegion'): parts.append(addr['addressRegion'])
                             if addr.get('addressCountry'): parts.append(addr['addressCountry'])
                             if parts:
                                 location = ", ".join(parts)
                                 break
            except: continue
        
        # Strategy B: Common meta tags
        if location == "Unknown":
            meta_loc = soup.find("meta", property="og:locality") or soup.find("meta", attrs={"name": "geo.placename"})
            if meta_loc and meta_loc.get("content"):
                location = meta_loc.get("content")
        
        if len(description) < 50:
            # If description is too short, we might have failed (SPA or protected)
            return {"error": "Could not extract sufficient text. The site might be JavaScript-heavy or protected."}

        return {
            "title": title,
            "company": company,
            "description": description,
            "location": location
        }

    except Exception as e:
        return {"error": str(e)}
