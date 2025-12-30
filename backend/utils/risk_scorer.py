"""
Comprehensive Fraud Risk Scoring Module
Combines multiple signals to generate a unified risk score.
"""
from typing import Optional
from .domain_check import analyze_url_security
from .company_verify import verify_company
from .blacklist import check_blacklist
from .explain import explain_prediction

# Suspicious keywords in job descriptions
HIGH_RISK_KEYWORDS = [
    "wire transfer", "western union", "money gram", "bitcoin payment",
    "personal bank account", "send money", "upfront fee", "processing fee",
    "registration fee", "training fee", "guaranteed income", "easy money",
    "work from home $5000", "unlimited earning", "no experience needed",
    "telegram interview", "whatsapp interview", "interview via chat",
    "copy paste job", "data entry $500", "typing job", "ad posting job",
    "email processing", "rebate processing", "envelope stuffing",
    "mlm", "network marketing", "recruitment bonus", "pyramid",
    "nigerian prince", "inheritance", "lottery winner"
]

MEDIUM_RISK_KEYWORDS = [
    "urgently hiring", "immediate start", "asap", "fast cash",
    "no resume required", "no interview", "same day pay",
    "flexible schedule $", "part time $1000", "simple tasks",
    "mystery shopper", "secret shopper", "personal assistant",
    "sugar daddy", "sugar mommy", "benefactor"
]

# Positive indicators (reduce risk)
POSITIVE_INDICATORS = [
    "401k", "health insurance", "dental", "vision", "pto",
    "paid time off", "equity", "stock options", "onsite",
    "hybrid", "team collaboration", "agile", "scrum",
    "background check", "drug test", "references required",
    "linkedin profile", "portfolio", "github", "years experience"
]


def calculate_text_risk(text: str) -> dict:
    """
    Analyze job description text for risk indicators.
    Returns risk score and flagged keywords.
    """
    if not text:
        return {"score": 20, "flags": ["No job description provided"], "positive": []}
    
    text_lower = text.lower()
    result = {
        "score": 0,
        "flags": [],
        "positive": [],
        "keyword_details": []
    }
    
    # Check high risk keywords
    for keyword in HIGH_RISK_KEYWORDS:
        if keyword in text_lower:
            result["score"] += 25
            result["flags"].append(f"🚨 '{keyword}'")
            result["keyword_details"].append({
                "word": keyword,
                "severity": "high",
                "impact": 25
            })
            
    # Check medium risk keywords
    for keyword in MEDIUM_RISK_KEYWORDS:
        if keyword in text_lower:
            result["score"] += 12
            result["flags"].append(f"⚠️ '{keyword}'")
            result["keyword_details"].append({
                "word": keyword,
                "severity": "medium",
                "impact": 12
            })
            
    # Check positive indicators
    for indicator in POSITIVE_INDICATORS:
        if indicator in text_lower:
            result["score"] -= 5
            result["positive"].append(indicator)
            
    # Salary red flags
    import re
    salary_patterns = [
        (r'\$\d{4,}\s*(?:per|/|a)\s*(?:day|daily)', 40, "Unrealistic daily pay"),
        (r'\$\d{5,}\s*(?:per|/|a)\s*(?:week|weekly)', 35, "Suspiciously high weekly pay"),
        (r'earn\s*\$?\d{4,}\s*(?:fast|quick|easy)', 30, "Get rich quick language"),
    ]
    
    for pattern, score, desc in salary_patterns:
        if re.search(pattern, text_lower):
            result["score"] += score
            result["flags"].append(f"💰 {desc}")
            
    # Check for lack of specific requirements (red flag)
    if len(text) < 100:
        result["score"] += 15
        result["flags"].append("Very short job description")
        
    # Check for contact methods (red flags)
    if "telegram" in text_lower or "whatsapp" in text_lower:
        result["score"] += 30
        result["flags"].append("🚨 Uses Telegram/WhatsApp for communication")
        
    if "personal email" in text_lower or "@gmail.com" in text_lower or "@yahoo.com" in text_lower:
        if "hr" not in text_lower and "recruiting" not in text_lower:
            result["score"] += 15
            result["flags"].append("Uses personal email for business")
            
    return result


def calculate_comprehensive_risk(
    text: str,
    title: str = "",
    company: str = "",
    url: Optional[str] = None,
    model = None,
    vectorizer = None
) -> dict:
    """
    Calculate comprehensive fraud risk score combining all signals.
    
    Returns a complete risk assessment with:
    - Overall risk score (0-100)
    - Risk level (low, medium, high, critical)
    - Detailed breakdown by category
    - AI prediction results
    - Recommendations
    """
    result = {
        "overall_score": 0,
        "risk_level": "unknown",
        "breakdown": {
            "text_analysis": {"score": 0, "weight": 0.3, "details": {}},
            "company_verification": {"score": 0, "weight": 0.25, "details": {}},
            "url_security": {"score": 0, "weight": 0.2, "details": {}},
            "blacklist_check": {"score": 0, "weight": 0.15, "details": {}},
            "ai_prediction": {"score": 0, "weight": 0.1, "details": {}}
        },
        "flags": [],
        "positive_signals": [],
        "recommendations": [],
        "is_blacklisted": False
    }
    
    # 1. Text Analysis
    text_result = calculate_text_risk(f"{title} {text} {company}")
    result["breakdown"]["text_analysis"]["score"] = min(100, max(0, text_result["score"]))
    result["breakdown"]["text_analysis"]["details"] = text_result
    result["flags"].extend(text_result["flags"][:5])  # Top 5 flags
    result["positive_signals"].extend(text_result["positive"][:3])
    
    # 2. Company Verification
    if company:
        company_result = verify_company(company)
        company_score = company_result.get("risk_score", 30)
        if company_result.get("verified"):
            company_score = 0
        result["breakdown"]["company_verification"]["score"] = min(100, company_score)
        result["breakdown"]["company_verification"]["details"] = company_result
        
        if company_result.get("verified"):
            result["positive_signals"].append(f"✅ Verified company: {company}")
        elif company_result.get("risk_level") == "high":
            result["flags"].append(f"⚠️ Company verification failed: {company}")
            
    # 3. URL Security Analysis
    if url:
        url_result = analyze_url_security(url)
        url_score = url_result.get("risk_score", 0)
        result["breakdown"]["url_security"]["score"] = min(100, url_score)
        result["breakdown"]["url_security"]["details"] = url_result
        
        if url_result.get("trusted"):
            result["positive_signals"].append("✅ Posted on trusted job platform")
        result["flags"].extend([f for f in url_result.get("flags", [])[:3] if "🚨" in f or "⚠️" in f])
        
    # 4. Blacklist Check
    blacklist_result = check_blacklist(url=url, company=company)
    if blacklist_result.get("is_blacklisted"):
        result["is_blacklisted"] = True
        result["breakdown"]["blacklist_check"]["score"] = 100
        result["breakdown"]["blacklist_check"]["details"] = blacklist_result
        result["flags"].insert(0, blacklist_result.get("recommendation", "🚨 BLACKLISTED"))
    else:
        result["breakdown"]["blacklist_check"]["score"] = 0
        
    # 5. AI Model Prediction
    if model and vectorizer:
        try:
            full_text = f"{title} {text} {company}"
            explanation = explain_prediction(full_text, model, vectorizer)
            
            # If AI says Fake, add to risk
            if explanation.get("prediction") == 0:  # Fake
                result["breakdown"]["ai_prediction"]["score"] = 70
            else:
                result["breakdown"]["ai_prediction"]["score"] = 0
                result["positive_signals"].append("✅ AI model predicts legitimate")
                
            result["breakdown"]["ai_prediction"]["details"] = explanation
            
        except Exception as e:
            result["breakdown"]["ai_prediction"]["details"] = {"error": str(e)}
            
    # Calculate weighted overall score
    total_weight = 0
    weighted_sum = 0
    
    for category, data in result["breakdown"].items():
        weight = data.get("weight", 0.2)
        score = data.get("score", 0)
        weighted_sum += score * weight
        total_weight += weight
        
    result["overall_score"] = round(weighted_sum / total_weight if total_weight > 0 else 50)
    
    # Boost score if blacklisted
    if result["is_blacklisted"]:
        result["overall_score"] = max(result["overall_score"], 85)
        
    # Determine risk level
    score = result["overall_score"]
    if score >= 70:
        result["risk_level"] = "critical"
        result["recommendations"] = [
            "🚨 DO NOT apply to this job",
            "This has multiple high-risk indicators",
            "Report this job if you haven't already"
        ]
    elif score >= 50:
        result["risk_level"] = "high"
        result["recommendations"] = [
            "⚠️ Exercise extreme caution",
            "Verify the company through official channels",
            "Never pay any fees or share sensitive info before verification"
        ]
    elif score >= 30:
        result["risk_level"] = "medium"
        result["recommendations"] = [
            "Proceed with caution",
            "Research the company on LinkedIn and Glassdoor",
            "Verify contact information independently"
        ]
    else:
        result["risk_level"] = "low"
        result["recommendations"] = [
            "✅ Lower risk detected",
            "Still verify company details before sharing personal information",
            "Trust your instincts during interviews"
        ]
        
    return result


def get_risk_badge_html(risk_level: str, score: int) -> str:
    """Generate HTML badge for risk level."""
    colors = {
        "critical": "#dc3545",
        "high": "#fd7e14",
        "medium": "#ffc107",
        "low": "#28a745",
        "unknown": "#6c757d"
    }
    
    labels = {
        "critical": "🚨 CRITICAL RISK",
        "high": "⚠️ HIGH RISK",
        "medium": "⚡ MEDIUM RISK",
        "low": "✅ LOW RISK",
        "unknown": "❓ UNKNOWN"
    }
    
    color = colors.get(risk_level, colors["unknown"])
    label = labels.get(risk_level, labels["unknown"])
    
    return f'<span style="background:{color};color:white;padding:4px 12px;border-radius:20px;font-weight:bold;">{label} ({score}/100)</span>'
