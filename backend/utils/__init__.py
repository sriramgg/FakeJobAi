# FakeJobAI Utilities Package
# Contains all utility modules for the backend

from .explain import explain_prediction
from .domain_check import analyze_url_security, check_domain
from .company_verify import verify_company
from .blacklist import check_blacklist, add_to_blacklist, get_blacklist_stats
from .risk_scorer import calculate_comprehensive_risk, calculate_text_risk
from .scraper import scrape_job_details
from .preprocess import clean_text

__all__ = [
    'explain_prediction',
    'analyze_url_security',
    'check_domain', 
    'verify_company',
    'check_blacklist',
    'add_to_blacklist',
    'get_blacklist_stats',
    'calculate_comprehensive_risk',
    'calculate_text_risk',
    'scrape_job_details',
    'clean_text'
]
