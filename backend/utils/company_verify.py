"""
Company Verification Module
Validates company legitimacy using multiple data sources.
"""
import os
import re
from typing import Optional
import requests

# Known Fortune 500 / Major Companies
KNOWN_COMPANIES = {
    "google": {"verified": True, "industry": "Technology", "employees": "100000+"},
    "microsoft": {"verified": True, "industry": "Technology", "employees": "100000+"},
    "amazon": {"verified": True, "industry": "E-commerce/Tech", "employees": "100000+"},
    "meta": {"verified": True, "industry": "Technology", "employees": "50000+"},
    "apple": {"verified": True, "industry": "Technology", "employees": "100000+"},
    "netflix": {"verified": True, "industry": "Entertainment", "employees": "10000+"},
    "adobe": {"verified": True, "industry": "Software", "employees": "25000+"},
    "salesforce": {"verified": True, "industry": "SaaS", "employees": "50000+"},
    "oracle": {"verified": True, "industry": "Enterprise Software", "employees": "100000+"},
    "ibm": {"verified": True, "industry": "Technology", "employees": "100000+"},
    "nvidia": {"verified": True, "industry": "Hardware/AI", "employees": "20000+"},
    "intel": {"verified": True, "industry": "Semiconductors", "employees": "100000+"},
    "cisco": {"verified": True, "industry": "Networking", "employees": "80000+"},
    "deloitte": {"verified": True, "industry": "Consulting", "employees": "300000+"},
    "pwc": {"verified": True, "industry": "Consulting", "employees": "300000+"},
    "kpmg": {"verified": True, "industry": "Consulting", "employees": "200000+"},
    "accenture": {"verified": True, "industry": "Consulting", "employees": "500000+"},
    "jpmorgan": {"verified": True, "industry": "Finance", "employees": "250000+"},
    "goldman sachs": {"verified": True, "industry": "Finance", "employees": "40000+"},
    "morgan stanley": {"verified": True, "industry": "Finance", "employees": "70000+"},
    "tesla": {"verified": True, "industry": "Automotive/Energy", "employees": "100000+"},
    "uber": {"verified": True, "industry": "Transportation", "employees": "30000+"},
    "airbnb": {"verified": True, "industry": "Hospitality", "employees": "6000+"},
    "spotify": {"verified": True, "industry": "Entertainment", "employees": "8000+"},
    "twitter": {"verified": True, "industry": "Social Media", "employees": "2000+"},
    "linkedin": {"verified": True, "industry": "Professional Network", "employees": "20000+"},
    "stripe": {"verified": True, "industry": "Fintech", "employees": "8000+"},
    "shopify": {"verified": True, "industry": "E-commerce", "employees": "10000+"},
    "tcs": {"verified": True, "industry": "IT Services", "employees": "500000+"},
    "infosys": {"verified": True, "industry": "IT Services", "employees": "300000+"},
    "wipro": {"verified": True, "industry": "IT Services", "employees": "200000+"},
}

# Red flag company name patterns
SUSPICIOUS_COMPANY_PATTERNS = [
    r"work.*from.*home.*inc",
    r"easy.*money",
    r"quick.*cash",
    r"online.*job.*\d+",
    r"data.*entry.*remote",
    r"typing.*job",
    r"copy.*paste.*job",
    r"hiring.*urgently",
    r"no.*experience.*needed",
    r"earn.*\$?\d{4,}.*week",
    r"earn.*\$?\d{4,}.*day",
]


def normalize_company_name(name: str) -> str:
    """Normalize company name for matching."""
    if not name:
        return ""
    # Remove common suffixes
    suffixes = [" inc", " llc", " ltd", " corp", " corporation", " co", " company", " pvt", " private", " limited"]
    name = name.lower().strip()
    for suffix in suffixes:
        if name.endswith(suffix):
            name = name[:-len(suffix)]
    return name.strip()


def check_known_company(company_name: str) -> dict:
    """
    Check if company is in our known companies database.
    """
    normalized = normalize_company_name(company_name)
    
    for known, data in KNOWN_COMPANIES.items():
        if known in normalized or normalized in known:
            return {
                "found": True,
                "verified": True,
                "company_name": company_name,
                "matched_name": known,
                "industry": data.get("industry"),
                "employees": data.get("employees"),
                "confidence": "high",
                "message": f"✅ {company_name} is a verified major company"
            }
    
    return {
        "found": False,
        "verified": False,
        "company_name": company_name,
        "message": "Company not in verified database"
    }


def check_suspicious_patterns(company_name: str) -> dict:
    """
    Check company name for red flag patterns.
    """
    result = {
        "is_suspicious": False,
        "flags": [],
        "risk_score": 0
    }
    
    if not company_name:
        result["flags"].append("No company name provided")
        result["risk_score"] += 20
        return result
    
    name_lower = company_name.lower()
    
    for pattern in SUSPICIOUS_COMPANY_PATTERNS:
        if re.search(pattern, name_lower):
            result["is_suspicious"] = True
            result["flags"].append(f"Suspicious pattern: '{pattern}'")
            result["risk_score"] += 30
            
    # Check for excessive punctuation (scam indicator)
    if name_lower.count('!') > 0 or name_lower.count('$') > 0:
        result["is_suspicious"] = True
        result["flags"].append("Contains unusual characters (!$)")
        result["risk_score"] += 15
        
    # Check for ALL CAPS (spam indicator)
    if company_name.isupper() and len(company_name) > 3:
        result["flags"].append("Company name is ALL CAPS")
        result["risk_score"] += 10
        
    # Check for very short/generic names
    if len(company_name.strip()) < 3:
        result["flags"].append("Very short company name")
        result["risk_score"] += 15
        
    return result


def verify_company_existence_google(company_name: str, api_key: Optional[str] = None) -> dict:
    """
    Verify company exists using Google Custom Search API (if key available).
    Falls back to heuristics if no API key.
    """
    result = {
        "method": "google_search",
        "exists": None,
        "website": None,
        "details": ""
    }
    
    if not api_key:
        api_key = os.getenv("GOOGLE_API_KEY")
        
    if not api_key:
        result["method"] = "heuristic"
        result["details"] = "Google API key not configured"
        return result
        
    try:
        # Using Google Custom Search API
        search_url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": api_key,
            "cx": os.getenv("GOOGLE_CSE_ID", ""),
            "q": f"{company_name} company official website",
            "num": 3
        }
        
        response = requests.get(search_url, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if "items" in data and len(data["items"]) > 0:
                result["exists"] = True
                result["website"] = data["items"][0].get("link")
                result["details"] = f"Found results for {company_name}"
            else:
                result["exists"] = False
                result["details"] = "No search results found"
        else:
            result["details"] = f"API error: {response.status_code}"
            
    except Exception as e:
        result["details"] = f"Search failed: {str(e)[:50]}"
        
    return result


def verify_company_clearbit(company_name: str, api_key: Optional[str] = None) -> dict:
    """
    Verify company using Clearbit API (if available).
    Provides rich company data.
    """
    result = {
        "method": "clearbit",
        "found": False,
        "data": None,
        "details": ""
    }
    
    if not api_key:
        api_key = os.getenv("CLEARBIT_API_KEY")
        
    if not api_key:
        result["details"] = "Clearbit API key not configured"
        return result
        
    try:
        url = "https://company.clearbit.com/v2/companies/find"
        headers = {"Authorization": f"Bearer {api_key}"}
        params = {"name": company_name}
        
        response = requests.get(url, headers=headers, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            result["found"] = True
            result["data"] = {
                "name": data.get("name"),
                "domain": data.get("domain"),
                "logo": data.get("logo"),
                "industry": data.get("category", {}).get("industry"),
                "employees": data.get("metrics", {}).get("employees"),
                "founded": data.get("foundedYear"),
                "location": data.get("location")
            }
            result["details"] = "Company verified via Clearbit"
        elif response.status_code == 404:
            result["details"] = "Company not found in Clearbit database"
        else:
            result["details"] = f"Clearbit API error: {response.status_code}"
            
    except Exception as e:
        result["details"] = f"Clearbit lookup failed: {str(e)[:50]}"
        
    return result


def verify_company(company_name: str) -> dict:
    """
    Main entry point for company verification.
    Combines multiple verification methods.
    """
    if not company_name or company_name.lower() in ["unknown", "n/a", "none", ""]:
        return {
            "company": company_name,
            "verified": False,
            "risk_level": "high",
            "risk_score": 50,
            "flags": ["No company name provided"],
            "recommendations": ["⚠️ Be very cautious - no company information available"]
        }
    
    result = {
        "company": company_name,
        "verified": False,
        "risk_level": "unknown",
        "risk_score": 0,
        "flags": [],
        "known_company": None,
        "recommendation": ""
    }
    
    # 1. Check known companies first
    known_check = check_known_company(company_name)
    result["known_company"] = known_check
    
    if known_check.get("verified"):
        result["verified"] = True
        result["risk_level"] = "low"
        result["flags"].append(known_check.get("message"))
    else:
        # 2. Check for suspicious patterns
        pattern_check = check_suspicious_patterns(company_name)
        result["risk_score"] += pattern_check.get("risk_score", 0)
        result["flags"].extend(pattern_check.get("flags", []))
        
        if pattern_check.get("is_suspicious"):
            result["risk_level"] = "high"
            
    # 3. Try Clearbit verification (if API key available)
    clearbit_result = verify_company_clearbit(company_name)
    if clearbit_result.get("found"):
        result["verified"] = True
        result["clearbit_data"] = clearbit_result.get("data")
        result["flags"].append("✅ Verified via Clearbit")
        result["risk_score"] = max(0, result["risk_score"] - 20)
    
    # 4. Automatic Domain & Age Analysis (New Feature)
    domain_analysis = analyze_company_domain(company_name)
    result["domain_info"] = domain_analysis
    
    if domain_analysis.get("found"):
        # Adjust risk based on domain age
        age_years = domain_analysis.get("age_years", 0)
        if age_years > 5:
            result["risk_score"] = max(0, result["risk_score"] - 10)
            result["flags"].append(f"✅ Established domain ({age_years}+ years)")
        elif age_years < 1:
            result["risk_score"] += 20
            result["flags"].append(f"⚠️ New domain detected (<1 year)")
            
        result["flags"].append(f"ℹ️ Domain: {domain_analysis['domain']}")
        
    # Calculate final risk level
    score = result["risk_score"]
    if not result["verified"]:
        if score >= 40:
            result["risk_level"] = "high"
            result["recommendation"] = "⚠️ High risk - verify company independently before applying"
        elif score >= 20:
            result["risk_level"] = "medium"
            result["recommendation"] = "Research the company on LinkedIn and official sources"
        else:
            result["risk_level"] = "medium"
            result["recommendation"] = "Company not verified - do your own research"
    else:
        result["risk_level"] = "low"
        result["recommendation"] = "✅ Company appears legitimate - proceed with normal caution"
        
    return result

from bs4 import BeautifulSoup
from urllib.parse import urlparse

def get_base_domain(url: str) -> str:
    """Extract base domain from a URL (e.g. https://www.google.com -> google.com)."""
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        netloc = urlparse(url).netloc
        if netloc.startswith('www.'):
            netloc = netloc[4:]
        return netloc
    except:
        return ""

def search_domain_duckduckgo(company_name: str) -> Optional[str]:
    """
    Search for official company website using DuckDuckGo HTML (no API key required).
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        query = f"{company_name} official site"
        url = "https://html.duckduckgo.com/html/"
        
        # Sriram: Using post request for HTML version
        response = requests.post(url, data={"q": query}, headers=headers, timeout=4)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            # Find first organic result
            result = soup.find("a", class_="result__a")
            if result:
                link = result.get("href")
                return get_base_domain(link)
    except Exception as e:
        print(f"Search Error: {e}")
    return None

def guess_company_domain(company_name: str) -> str:
    """Guess domain from company name (heuristic)."""
    clean = normalize_company_name(company_name).replace(" ", "").replace("&", "").replace("-", "")
    return f"{clean}.com"

def analyze_company_domain(company_name: str) -> dict:
    """
    Attempt to find and analyze company domain.
    1. Try Heuristic (Name + .com)
    2. If that fails (no DNS), Try Search
    3. If Search finds domain, Analyze it
    """
    from utils.domain_check import check_domain_age_whois, check_domain_dns
    
    # 1. Block generic placeholders
    if company_name.lower() in ["unknown", "unknown company", "confidential", "hidden", "n/a"]:
        return {
            "found": False,
            "domain": None,
            "method": "blocked",
            "age_days": 0,
            "age_years": 0,
            "created": None,
            "details": "Generic company name provided"
        }

    # 2. Try Heuristic
    heuristic_domain = guess_company_domain(company_name)
    target_domain = heuristic_domain
    method = "heuristic"
    
    # Check if heuristic resolves
    dns_check = check_domain_dns(target_domain)
    
    # 2. If Heuristic fails, Try Search
    if not dns_check.get("has_valid_dns"):
        print(f"Heuristic domain {heuristic_domain} failed. Searching web...")
        searched_domain = search_domain_duckduckgo(company_name)
        if searched_domain:
            target_domain = searched_domain
            method = "search"
            # Re-check DNS for the searched domain
            dns_check = check_domain_dns(target_domain)
            
    result = {
        "found": False,
        "domain": target_domain if dns_check.get("has_valid_dns") else None,
        "method": method,
        "age_days": 0,
        "age_years": 0,
        "created": None,
        "details": "Could not verify company domain"
    }
    
    if dns_check.get("has_valid_dns"):
        result["found"] = True
        result["domain"] = target_domain
        
        # 3. Check WHOIS Age
        whois_check = check_domain_age_whois(target_domain)
        result["age_days"] = whois_check.get("age_days", 0)
        result["created"] = whois_check.get("creation_date")
        result["details"] = whois_check.get("details")
        
        if result["age_days"]:
            result["age_years"] = round(result["age_days"] / 365, 1)
            
    return result
