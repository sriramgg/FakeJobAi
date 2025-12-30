"""
Scam Blacklist Database Module
Manages a global database of reported scam URLs, domains, and company names.
"""
import os
import sqlite3
from datetime import datetime
from typing import Optional, List
from urllib.parse import urlparse

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "blacklist.db")


def init_blacklist_db():
    """Initialize the blacklist database tables."""
    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Blacklisted URLs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blacklisted_urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE NOT NULL,
            domain TEXT,
            report_count INTEGER DEFAULT 1,
            first_reported TEXT,
            last_reported TEXT,
            severity TEXT DEFAULT 'medium',
            details TEXT
        )
    """)
    
    # Blacklisted domains table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blacklisted_domains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain TEXT UNIQUE NOT NULL,
            report_count INTEGER DEFAULT 1,
            first_reported TEXT,
            last_reported TEXT,
            severity TEXT DEFAULT 'medium',
            reason TEXT
        )
    """)
    
    # Blacklisted company names table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blacklisted_companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            normalized_name TEXT UNIQUE,
            report_count INTEGER DEFAULT 1,
            first_reported TEXT,
            last_reported TEXT,
            aliases TEXT,
            reason TEXT
        )
    """)
    
    # User reports tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT,
            company TEXT,
            reporter TEXT,
            details TEXT,
            timestamp TEXT,
            verified BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'pending'
        )
    """)
    
    conn.commit()
    conn.close()


# Initialize on module load
init_blacklist_db()


def normalize_url(url: str) -> str:
    """Normalize URL for comparison."""
    if not url:
        return ""
    url = url.lower().strip()
    # Remove trailing slashes and query params for base matching
    parsed = urlparse(url)
    return f"{parsed.netloc}{parsed.path}".rstrip('/')


def extract_domain_from_url(url: str) -> str:
    """Extract domain from URL."""
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except:
        return ""


def normalize_company_name(name: str) -> str:
    """Normalize company name for matching."""
    if not name:
        return ""
    suffixes = [" inc", " llc", " ltd", " corp", " corporation", " co", " company"]
    name = name.lower().strip()
    for suffix in suffixes:
        if name.endswith(suffix):
            name = name[:-len(suffix)]
    # Remove special chars
    import re
    name = re.sub(r'[^\w\s]', '', name)
    return name.strip()


def add_to_blacklist(url: str = None, domain: str = None, company: str = None, 
                     details: str = "", severity: str = "medium") -> dict:
    """
    Add an entry to the blacklist.
    Can blacklist URL, domain, or company name.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    results = {"added": [], "updated": []}
    
    try:
        # Add URL
        if url:
            normalized_url = normalize_url(url)
            domain_from_url = extract_domain_from_url(url)
            
            cursor.execute("""
                INSERT INTO blacklisted_urls (url, domain, first_reported, last_reported, severity, details)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(url) DO UPDATE SET
                    report_count = report_count + 1,
                    last_reported = ?,
                    severity = CASE WHEN severity = 'critical' THEN 'critical' ELSE ? END
            """, (normalized_url, domain_from_url, now, now, severity, details, now, severity))
            
            if cursor.rowcount > 0:
                results["added"].append(f"URL: {normalized_url[:50]}...")
            else:
                results["updated"].append(f"URL: {normalized_url[:50]}...")
                
            # Also blacklist the domain if new
            if domain_from_url:
                domain = domain_from_url
                
        # Add Domain
        if domain:
            cursor.execute("""
                INSERT INTO blacklisted_domains (domain, first_reported, last_reported, severity, reason)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(domain) DO UPDATE SET
                    report_count = report_count + 1,
                    last_reported = ?
            """, (domain.lower(), now, now, severity, details, now))
            
            results["added" if cursor.rowcount > 0 else "updated"].append(f"Domain: {domain}")
            
        # Add Company
        if company:
            normalized = normalize_company_name(company)
            cursor.execute("""
                INSERT INTO blacklisted_companies (company_name, normalized_name, first_reported, last_reported, reason)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(normalized_name) DO UPDATE SET
                    report_count = report_count + 1,
                    last_reported = ?
            """, (company, normalized, now, now, details, now))
            
            results["added" if cursor.rowcount > 0 else "updated"].append(f"Company: {company}")
            
        conn.commit()
        
    except Exception as e:
        results["error"] = str(e)
    finally:
        conn.close()
        
    return results


def check_blacklist(url: str = None, company: str = None) -> dict:
    """
    Check if URL or company is blacklisted.
    Returns blacklist status and details.
    """
    result = {
        "is_blacklisted": False,
        "url_blacklisted": False,
        "domain_blacklisted": False,
        "company_blacklisted": False,
        "matches": [],
        "severity": "none",
        "recommendation": ""
    }
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check URL
        if url:
            normalized_url = normalize_url(url)
            domain = extract_domain_from_url(url)
            
            # Exact URL match
            cursor.execute("""
                SELECT url, report_count, severity, details FROM blacklisted_urls 
                WHERE url = ? OR url LIKE ?
            """, (normalized_url, f"%{domain}%"))
            
            url_matches = cursor.fetchall()
            if url_matches:
                result["url_blacklisted"] = True
                result["is_blacklisted"] = True
                for match in url_matches:
                    result["matches"].append({
                        "type": "url",
                        "value": match[0],
                        "report_count": match[1],
                        "severity": match[2],
                        "details": match[3]
                    })
                    if match[2] == "critical":
                        result["severity"] = "critical"
                    elif match[2] == "high" and result["severity"] != "critical":
                        result["severity"] = "high"
                        
            # Domain match
            cursor.execute("""
                SELECT domain, report_count, severity FROM blacklisted_domains 
                WHERE domain = ?
            """, (domain,))
            
            domain_matches = cursor.fetchall()
            if domain_matches:
                result["domain_blacklisted"] = True
                result["is_blacklisted"] = True
                for match in domain_matches:
                    result["matches"].append({
                        "type": "domain",
                        "value": match[0],
                        "report_count": match[1],
                        "severity": match[2]
                    })
                    
        # Check Company
        if company:
            normalized = normalize_company_name(company)
            
            cursor.execute("""
                SELECT company_name, report_count, reason FROM blacklisted_companies 
                WHERE normalized_name = ? OR company_name LIKE ?
            """, (normalized, f"%{company}%"))
            
            company_matches = cursor.fetchall()
            if company_matches:
                result["company_blacklisted"] = True
                result["is_blacklisted"] = True
                for match in company_matches:
                    result["matches"].append({
                        "type": "company",
                        "value": match[0],
                        "report_count": match[1],
                        "reason": match[2]
                    })
                    
        # Set recommendation
        if result["is_blacklisted"]:
            total_reports = sum(m.get("report_count", 1) for m in result["matches"])
            
            if result["severity"] == "critical" or total_reports >= 5:
                result["severity"] = "critical"
                result["recommendation"] = "🚨 CONFIRMED SCAM! This has been reported multiple times. DO NOT apply."
            elif total_reports >= 3:
                result["severity"] = "high"
                result["recommendation"] = "⚠️ Multiple scam reports exist for this job/company. Avoid!"
            else:
                result["severity"] = "medium"
                result["recommendation"] = "⚠️ This has been flagged as suspicious. Proceed with caution."
                
    except Exception as e:
        result["error"] = str(e)
    finally:
        conn.close()
        
    return result


def get_recent_blacklist_entries(limit: int = 20) -> List[dict]:
    """Get recently added blacklist entries."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    entries = []
    
    try:
        # Get recent URLs
        cursor.execute("""
            SELECT 'url' as type, url as value, report_count, severity, first_reported 
            FROM blacklisted_urls 
            ORDER BY first_reported DESC LIMIT ?
        """, (limit // 2,))
        entries.extend([dict(zip(['type', 'value', 'report_count', 'severity', 'date'], row)) for row in cursor.fetchall()])
        
        # Get recent companies
        cursor.execute("""
            SELECT 'company' as type, company_name as value, report_count, 'medium' as severity, first_reported 
            FROM blacklisted_companies 
            ORDER BY first_reported DESC LIMIT ?
        """, (limit // 2,))
        entries.extend([dict(zip(['type', 'value', 'report_count', 'severity', 'date'], row)) for row in cursor.fetchall()])
        
    except Exception as e:
        pass
    finally:
        conn.close()
        
    # Sort by date
    entries.sort(key=lambda x: x.get('date', ''), reverse=True)
    return entries[:limit]


def get_blacklist_stats() -> dict:
    """Get blacklist statistics."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    stats = {
        "total_urls": 0,
        "total_domains": 0,
        "total_companies": 0,
        "total_reports": 0,
        "critical_count": 0
    }
    
    try:
        cursor.execute("SELECT COUNT(*) FROM blacklisted_urls")
        stats["total_urls"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM blacklisted_domains")
        stats["total_domains"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM blacklisted_companies")
        stats["total_companies"] = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(report_count) FROM blacklisted_urls")
        result = cursor.fetchone()[0]
        stats["total_reports"] = result if result else 0
        
        cursor.execute("SELECT COUNT(*) FROM blacklisted_urls WHERE severity = 'critical'")
        stats["critical_count"] = cursor.fetchone()[0]
        
    except Exception as e:
        stats["error"] = str(e)
    finally:
        conn.close()
        
    return stats
