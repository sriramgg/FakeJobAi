# 🚀 FakeJobAI Deployment Guide

## 📱 1. How to Use as a Mobile App (PWA)
Your project is now a **Progressive Web App (PWA)**! This means you can install it on your phone without going through the App Store.

### Android
1. Open the website (e.g., `http://localhost:3000` or your live URL) in **Chrome**.
2. Tap the **three dots** menu ⋮.
3. Tap **"Add to Home Screen"** or **"Install App"**.
4. The app will appear on your home screen like a native app.

### iOS (iPhone)
1. Open the website in **Safari**.
2. Tap the **Share** button (box with arrow up).
3. Scroll down and tap **"Add to Home Screen"**.

---

## 🌐 2. How to Host Live (Free/Cheap)

Since your project has a **Backend (Python)** and **Frontend (HTML/JS)**, the easiest way to host it is using **Render.com** (best for Python) or **Vercel** (for frontend only).

### Recommended: Deploy Everything on Render.com (Easiest)
Render is great because it supports Python natively.

#### Step 1: Push Code to GitHub
1. Make sure your code is on a GitHub repository.
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create repo on GitHub.com -> 'New Repository'
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin master
   ```

#### Step 2: Configure Render
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. **Settings:**
   - **Name:** `fakejobai`
   - **Language:** `Python`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:**
     - Add `PYTHON_VERSION` = `3.10.0`
5. Click **Create Web Service**.

#### Step 3: Frontend
Since your frontend is just static HTML/JS, you have two options:
1. **Option A (Professional):** Host frontend separately on **Netlify** or **Vercel**.
   - Drag and drop your `frontend` folder into Netlify.
   - Update `API_BASE` in `frontend/js/app-core.js` to point to your Render backend URL (e.g., `https://fakejobai.onrender.com/analyze`).
2. **Option B (Lazy/Simple):** Serve frontend FROM the backend.
   - *Note: This requires a small code change in `backend/app.py` to serve static files.*

---

## 🛠️ database Note (Important)
You are using **SQLite**. 
- On services like Render (Free Tier), the **file system resets** every time you deploy or the server restarts (~15 mins of inactivity).
- **Consequence:** Your user history and dashboard stats will reset often.
- **Fix for Production:** Use a real database like **PostgreSQL** (Render offers a managed Postgres database).

---

## ⚡ Quick Start for Production (Option B Code)
To serve everything from one place, add this to `backend/app.py`:

```python
from fastapi.staticfiles import StaticFiles

# ... existing code ...

app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
```
*(Then you only need to deploy the Python app on Render, and your website will just work!)*
