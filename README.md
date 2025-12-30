# 🚨 FakeJobAI - Professional Job Scam Detection System

![FakeJobAI Logo](frontend/assets/images/logo.svg)

**FakeJobAI** is a premium, AI-powered platform designed to protect job seekers from the rising tide of fraudulent job postings. Using advanced Machine Learning, real-time web scraping, and domain intelligence, FakeJobAI analyzes job descriptions and URLs to provide a comprehensive security verdict.

## ✨ Core Features (Next Level Edition)

*   **🧠 Neural Reasoning (Gemini 1.5 Pro)**: Beyond simple ML, our system uses Gemini to explain the 'why' behind every scam detection with human-level intelligence.
*   **🛡️ AI Sentinel (Auto-Threat Intel)**: High-confidence scams are automatically reported to our global threat database to protect the community in real-time.
*   **📄 Professional Audit Reports**: Download comprehensive PDF analysis reports featuring risk heatmaps, security flags, and AI-generated insights.
*   **📧 Pulse Email System**: Automated security alerts and welcome sequences to keep you updated on your job search safety.
*   **🔍 Advanced URL Engine**: Enhanced scraping logic for major platforms like LinkedIn, Indeed, and Glassdoor.
*   **📊 Dynamic Dashboard**: Professional analytics featuring risk distribution charts, trend lines, and detailed history.
*   **🎨 Premium Glassmorphic UI**: Modern interface with neural-background animations and smooth transitions.

## 🛠️ Technology Stack

### Frontend
- **HTML5 & Vanilla CSS**: Custom-built design system with a focus on Glassmorphism and modern aesthetics.
- **JavaScript (ES6+)**: High-performance, reactive UI logic with deferred initialization.
- **Bootstrap 5**: Responsive layout framework.
- **Leaflet.js**: Professional interactive mapping with dark-theme tiles.
- **Chart.js**: Dynamic data visualization for risk trends and statistics.
- **AOS (Animate On Scroll)**: Smooth viewport-triggered animations.

### Backend
- **FastAPI**: Modern, high-performance Python web framework for asynchronous API handling.
- **Uvicorn**: ASGI server for lightning-fast request processing.
- **BeautifulSoup4 & Lxml**: Robust web scraping for extracting job details from various platforms.
- **SQLAlchemy**: Database ORM for managing analysis history and reports.

### Artificial Intelligence & Security
- **Scikit-Learn**: Hybrid ML model (Logistic Regression & Random Forest) for text classification.
- **TF-IDF Vectorizer**: Advanced natural language processing for feature extraction.
- **python-whois**: Real-world domain age and registrar verification.
- **Google Generative AI (Gemini)**: Powers the deep AI explanations and recommendations.

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js (optional, for asset management)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/FakeJobAI.git
   cd FakeJobAI
   ```

2. **Set up the Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Environment Variables**:
   Create a `.env` file in the `backend` directory and add your API keys:
   ```env
   GOOGLE_API_KEY=your_gemini_key_here
   API_BASE_URL=http://localhost:8000
   ```

### Running the Application

1. **Start the Backend Server**:
   From the `backend` directory:
   ```bash
   uvicorn app:app --reload
   ```

2. **Access the Frontend**:
   Simply open `frontend/index.html` in your favorite web browser.
   *Note: For full authentication features, it's recommended to serve the frontend via a local server (e.g., Live Server extension in VS Code).*

## 📂 Project Structure

```text
├── backend/
│   ├── ai/             # ML Model and Training Pipelines
│   ├── data/           # Datasets and Training CSVs
│   ├── routes/         # FastAPI Endpoint Handlers
│   ├── utils/          # Scraper, Domain Checker, and Shared Tools
│   ├── app.py          # Main API Entry Point
│   └── requirements.txt
├── frontend/
│   ├── assets/
│   │   ├── css/        # Design system and Component Styles
│   │   ├── js/         # Core Logic, Map, and Background Engines
│   │   └── images/     # UI Icons and Graphics
│   ├── dashboard.html  # Main Analytics Hub
│   ├── login.html      # Authentication Page
│   └── index.html      # Public Landing Page
└── README.md
```

## 🔒 Security & Privacy
FakeJobAI does not store your personal job application data. Scanned URLs and descriptions are analyzed in real-time to provide safety verdicts. User accounts are managed securely via Firebase/Custom Auth integration.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ by the FakeJobAI Team to make the job market a safer place.*
