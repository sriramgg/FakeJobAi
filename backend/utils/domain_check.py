"""
Domain Age & Verification Module
Checks WHOIS data for domain registration age and suspicious indicators.
"""
import re
from datetime import datetime, timedelta
from urllib.parse import urlparse
import socket

# Known legitimate job domains
TRUSTED_JOB_DOMAINS = [
    "linkedin.com", "indeed.com", "glassdoor.com", "monster.com",
    "ziprecruiter.com", "careerbuilder.com", "simplyhired.com",
    "dice.com", "hired.com", "angel.co", "wellfound.com",
    "lever.co", "greenhouse.io", "workday.com", "brassring.com",
    "icims.com", "jobvite.com", "workable.com", "google.com",
    "microsoft.com", "amazon.jobs", "meta.com", "apple.com"
]

# Suspicious Top-Level Domains
SUSPICIOUS_TLDS = [
    ".xyz", ".top", ".work", ".click", ".link", ".info", 
    ".online", ".site", ".website", ".space", ".pw", ".tk",
    ".ml", ".ga", ".cf", ".gq", ".cc"
]

# Known scam patterns in URLs
SCAM_URL_PATTERNS = [
    r"job.*offer.*\d+",
    r"urgent.*hiring",
    r"work.*from.*home.*\d+k",
    r"telegram",
    r"whatsapp",
    r"bit\.ly",
    r"tinyurl",
    r"goo\.gl"
]

def extract_domain(url: str) -> dict:
    """
    Extract domain information from URL.
    Returns domain parts and analysis.
    """
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Remove www prefix
        if domain.startswith('www.'):
            domain = domain[4:]
            
        # Extract TLD
        parts = domain.split('.')
        tld = '.' + parts[-1] if parts else ''
        
        # Get base domain (e.g., "linkedin" from "linkedin.com")
        base_domain = parts[-2] if len(parts) >= 2 else domain
        
        return {
            "full_domain": domain,
            "base_domain": base_domain,
            "tld": tld,
            "path": parsed.path,
            "is_valid": True
        }
    except Exception as e:
        return {
            "full_domain": url,
            "base_domain": "",
            "tld": "",
            "path": "",
            "is_valid": False,
            "error": str(e)
        }


def check_domain_age_whois(domain: str) -> dict:
    """
    Attempt to check domain age via WHOIS lookup.
    Uses python-whois library if available, otherwise uses heuristics.
    """
    result = {
        "domain": domain,
        "age_days": None,
        "creation_date": None,
        "is_new_domain": False,
        "risk_level": "unknown",
        "details": ""
    }
    
    try:
        import whois
        w = whois.whois(domain)
        
        if w.creation_date:
            # Handle list of dates
            creation = w.creation_date
            if isinstance(creation, list):
                creation = creation[0]
            
            if isinstance(creation, datetime):
                age = datetime.now() - creation
                result["age_days"] = age.days
                result["creation_date"] = creation.strftime("%Y-%m-%d")
                
                # Risk assessment based on age
                if age.days < 30:
                    result["is_new_domain"] = True
                    result["risk_level"] = "critical"
                    result["details"] = f"🚨 EXTREMELY NEW DOMAIN! Created only {age.days} days ago."
                elif age.days < 90:
                    result["is_new_domain"] = True
                    result["risk_level"] = "high"
                    result["details"] = f"⚠️ Very new domain. Created {age.days} days ago."
                elif age.days < 365:
                    result["risk_level"] = "medium"
                    result["details"] = f"Domain is less than 1 year old ({age.days} days)."
                else:
                    years = age.days // 365
                    result["risk_level"] = "low"
                    result["details"] = f"✅ Established domain. {years}+ years old."
                    
        else:
            result["details"] = "Could not retrieve creation date."
            
        # Check registrar for suspicious patterns
        if w.registrar:
            registrar_lower = str(w.registrar).lower()
            suspicious_registrars = ["namecheap", "epik", "porkbun", "hostinger"]
            if any(r in registrar_lower for r in suspicious_registrars):
                result["details"] += " (Budget registrar - often used by scammers)"
                if result["risk_level"] == "low":
                    result["risk_level"] = "medium"
                    
    except ImportError:
        result["details"] = "WHOIS library not installed. Install with: pip install python-whois"
    except Exception as e:
        result["details"] = f"WHOIS lookup failed: {str(e)[:100]}"
        
    return result


def check_domain_dns(domain: str) -> dict:
    """
    Basic DNS checks to verify domain exists and has proper records.
    """
    result = {
        "domain": domain,
        "has_valid_dns": False,
        "ip_address": None,
        "details": ""
    }
    
    try:
        ip = socket.gethostbyname(domain)
        result["has_valid_dns"] = True
        result["ip_address"] = ip
        result["details"] = f"Domain resolves to {ip}"
    except socket.gaierror:
        result["details"] = "⚠️ Domain does not resolve - may be dead or fake"
    except Exception as e:
        result["details"] = f"DNS check error: {str(e)[:50]}"
        
    return result


def analyze_url_security(url: str) -> dict:
    """
    Comprehensive URL security analysis.
    Returns a risk score and detailed breakdown.
    """
    domain_info = extract_domain(url)
    
    result = {
        "url": url,
        "domain": domain_info.get("full_domain", ""),
        "risk_score": 0,  # 0-100, higher = more risky
        "risk_level": "unknown",
        "flags": [],
        "trusted": False,
        "domain_age": None,
        "recommendations": []
    }
    
    # 1. Check if trusted domain
    domain = domain_info.get("full_domain", "").lower()
    for trusted in TRUSTED_JOB_DOMAINS:
        if domain.endswith(trusted):
            result["trusted"] = True
            result["flags"].append(f"✅ Trusted job platform: {trusted}")
            result["risk_score"] -= 30  # Reduce risk
            break
    
    # 2. Check suspicious TLDs
    tld = domain_info.get("tld", "")
    if tld in SUSPICIOUS_TLDS:
        result["risk_score"] += 25
        result["flags"].append(f"🚨 Suspicious TLD: {tld}")
        
    # 3. Check for URL shorteners (red flag)
    shorteners = ["bit.ly", "tinyurl", "goo.gl", "t.co", "ow.ly", "is.gd"]
    if any(s in url.lower() for s in shorteners):
        result["risk_score"] += 40
        result["flags"].append("🚨 URL Shortener detected - could hide malicious destination")
        
    # 4. Check for scam patterns in URL
    for pattern in SCAM_URL_PATTERNS:
        if re.search(pattern, url.lower()):
            result["risk_score"] += 20
            result["flags"].append(f"⚠️ Suspicious pattern in URL: {pattern}")
            
    # 5. Check domain age (if WHOIS available)
    if not result["trusted"]:
        whois_result = check_domain_age_whois(domain)
        result["domain_age"] = whois_result
        
        if whois_result.get("is_new_domain"):
            result["risk_score"] += 35
            result["flags"].append(whois_result.get("details", "New domain detected"))
        elif whois_result.get("risk_level") == "medium":
            result["risk_score"] += 15
            
    # 6. DNS check
    dns_result = check_domain_dns(domain)
    if not dns_result.get("has_valid_dns"):
        result["risk_score"] += 30
        result["flags"].append("⚠️ Domain has no valid DNS records")
        
    # 7. Calculate final risk level
    score = max(0, min(100, result["risk_score"]))  # Clamp 0-100
    result["risk_score"] = score
    
    if score >= 60:
        result["risk_level"] = "critical"
        result["recommendations"].append("Do NOT apply to this job - high likelihood of scam")
    elif score >= 40:
        result["risk_level"] = "high"
        result["recommendations"].append("Exercise extreme caution - verify company independently")
    elif score >= 20:
        result["risk_level"] = "medium"
        result["recommendations"].append("Verify company contact info before sharing personal data")
    else:
        result["risk_level"] = "low"
        if result["trusted"]:
            result["recommendations"].append("Job is from a known platform - still verify company details")
        else:
            result["recommendations"].append("Lower risk, but always research the company")
            
    return result


def check_domain(url: str) -> dict:
    """
    Main entry point for domain checking.
    Returns comprehensive analysis.
    """
    return analyze_url_security(url)


# Simple text domain check (legacy function)
def check_text_for_forbidden_domains(text: str) -> bool:
    """Check if text contains known spam domains."""
    forbidden_domains = ["example.com", "spam.com", "scam.com", "fake.com"]
    return any(domain in text.lower() for domain in forbidden_domains)
