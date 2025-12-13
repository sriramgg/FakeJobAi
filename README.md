# 🛡️ FakeJobAI - AI-Powered Job Scam Detector

<div align="center">

![FakeJobAI Logo](frontend/assets/images/ai-logo.png)

**Protect job seekers from fraudulent job postings using advanced AI and multi-signal risk analysis.**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](docker-compose.yml)

</div>

---

## 🚀 Features

### 🧠 AI-Powered Detection
- **Machine Learning Model** trained on thousands of real/fake job postings
- **Explainable AI** - See exactly which words triggered the fraud alert
- **Confidence Scoring** - Know how certain the AI is about its prediction

### 🔍 Multi-Signal Risk Analysis
- **Domain Age Check** - WHOIS lookup to detect newly registered scam domains
- **Company Verification** - Validates company against known legitimate businesses
- **URL Security Analysis** - Checks for suspicious TLDs, URL shorteners, and patterns
- **Scam Blacklist** - Community-reported scam database

### 📊 Comprehensive Risk Scoring
- **0-100 Risk Score** combining all signals
- **Risk Level Classification** - Low, Medium, High, Critical
- **Detailed Flags** showing exactly what's suspicious
- **Positive Signals** highlighting trustworthy indicators

### 🌐 Multiple Input Methods
- **URL Scanning** - Paste any job posting link
- **Manual Entry** - Copy/paste job details
- **CSV Bulk Upload** - Analyze multiple jobs at once
- **Chrome Extension** - Scan jobs while browsing

### 📈 Analytics Dashboard
- Real-time statistics
- Trend visualization
- Risk distribution charts
- Feedback tracking

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | FastAPI, Python 3.11+ |
| **ML Model** | Scikit-learn (TF-IDF + Logistic Regression) |
| **Frontend** | HTML5, CSS3, JavaScript, Bootstrap 5 |
| **Database** | SQLite |
| **AI Chat** | OpenAI GPT / Google Gemini (fallback) |
| **Deployment** | Docker, Nginx |

---

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js (optional, for frontend dev server)
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fakejobai.git
cd fakejobai
```

2. **Set up Python environment**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
# Create backend/.env file
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
CLEARBIT_API_KEY=optional_clearbit_key
```

4. **Start the backend**
```bash
uvicorn app:app --reload --port 8000
```

5. **Open the frontend**
- Open `frontend/index.html` in your browser
- Or use a local server: `npx serve frontend`

---

## 🐳 Docker Deployment

The easiest way to deploy FakeJobAI:

```bash
# Build and run
docker-compose up --build

# Access the application
# Frontend: http://localhost
# API: http://localhost:8000
```

### Environment Variables (docker-compose)
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=sk-your-key
GEMINI_API_KEY=your-gemini-key
CLEARBIT_API_KEY=optional
```

---

## 🧩 Chrome Extension

### Installation
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

### Usage
1. Navigate to any job posting (LinkedIn, Indeed, Glassdoor)
2. Click the FakeJobAI extension icon
3. Click "Analyze This Job"
4. View the instant risk assessment

---

## 📡 API Endpoints

### Core Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze/predict-text` | Analyze job from text |
| POST | `/analyze/predict-url` | Analyze job from URL |
| POST | `/analyze/predict-csv` | Bulk analyze from CSV |

### Security Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze/check-domain` | Domain security analysis |
| POST | `/analyze/verify-company` | Company verification |
| POST | `/analyze/check-blacklist` | Check scam blacklist |

### Feedback & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze/feedback` | Submit prediction feedback |
| POST | `/analyze/report-scam` | Report a scam |
| GET | `/analyze/analytics` | Get dashboard analytics |

### Example Request

```bash
curl -X POST "http://localhost:8000/analyze/predict-text" \
  -F "title=Software Developer" \
  -F "description=Great opportunity..." \
  -F "company_profile=Google"
```

### Example Response

```json
{
  "prediction": 1,
  "result": "✅ Real Job",
  "confidence": "94.5%",
  "risk_analysis": {
    "overall_score": 15,
    "risk_level": "low",
    "flags": [],
    "positive_signals": ["✅ Verified company: Google"],
    "recommendations": ["✅ Lower risk detected"]
  },
  "explanation": {
    "top_words": ["google", "software", "developer"]
  }
}
```

---

## 🎯 Risk Scoring System

The risk score (0-100) is calculated using weighted signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Text Analysis | 30% | Suspicious keywords, salary red flags |
| Company Verification | 25% | Known company, suspicious patterns |
| URL Security | 20% | Domain age, TLD, DNS |
| Blacklist Check | 15% | Community reports |
| AI Prediction | 10% | ML model confidence |

### Risk Levels

| Level | Score Range | Meaning |
|-------|-------------|---------|
| 🟢 Low | 0-29 | Likely legitimate |
| 🟡 Medium | 30-49 | Proceed with caution |
| 🟠 High | 50-69 | Strong scam indicators |
| 🔴 Critical | 70-100 | Confirmed/highly likely scam |

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:
```env
# Required
OPENAI_API_KEY=your_key

# Fallback AI
GEMINI_API_KEY=your_key

# Optional (enhanced features)
CLEARBIT_API_KEY=your_key
GOOGLE_API_KEY=your_key
GOOGLE_CSE_ID=your_id
```

### Model Retraining

To retrain the ML model with new data:
```bash
cd backend
python ai/train_hybrid_model.py
```

---

## 📊 Project Structure

```
fakejobai/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── routes/
│   │   └── analyze.py      # Main API routes
│   ├── utils/
│   │   ├── explain.py      # AI explainability
│   │   ├── domain_check.py # Domain security
│   │   ├── company_verify.py # Company validation
│   │   ├── blacklist.py    # Scam database
│   │   ├── risk_scorer.py  # Risk calculation
│   │   └── scraper.py      # URL scraping
│   ├── models/             # Trained ML models
│   ├── data/               # SQLite databases
│   └── ai/                 # Training scripts
├── frontend/
│   ├── index.html          # Landing page
│   ├── dashboard.html      # Main dashboard
│   ├── history.html        # Scan history
│   ├── report.html         # Report scam
│   └── assets/             # Images, styles
├── extension/
│   ├── manifest.json       # Chrome extension config
│   ├── popup.html          # Extension UI
│   ├── popup.js            # Extension logic
│   └── style.css           # Extension styles
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.backend      # Backend container
├── Dockerfile.frontend     # Frontend container
└── README.md               # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- Dataset: [Kaggle Fake Job Postings](https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction)
- Icons: [FontAwesome](https://fontawesome.com)
- UI Framework: [Bootstrap 5](https://getbootstrap.com)

---

<div align="center">

**Made with ❤️ to protect job seekers worldwide**

[Report Bug](https://github.com/yourusername/fakejobai/issues) · [Request Feature](https://github.com/yourusername/fakejobai/issues)

</div>
