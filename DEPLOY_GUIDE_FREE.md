# 🚀 Lifetime Free Hosting Guide for FakeJobAI

This guide explains how to deploy your **FakeJobAI** project for free using **Render.com**. 
Render offers a generous free tier for Web Services and Static Sites that is perfect for this project.

## 📋 Prerequisites
1.  **GitHub Account**: Your project must be pushed to a GitHub repository.
2.  **Render Account**: Sign up at [dashboard.render.com](https://dashboard.render.com) (Login with GitHub recommended).

---

## 🛠️ Method: Unified Deployment (Backend + Frontend)
Since your `app.py` is already configured to serve the `frontend` folder, the easiest way is to deploy a single Python Web Service.

### Step 1: Prepare Your Project
1.  Ensure your project structure on GitHub matches your local:
    ```
    / (root)
      ├── backend/
      │     ├── app.py
      │     ├── requirements.txt
      ├── frontend/
      │     ├── index.html
      │     ├── ...
    ```
2.  **Important**: Ensure `backend/requirements.txt` is present and up to date.

### Step 2: Create a Web Service on Render
1.  Go to the [Render Dashboard](https://dashboard.render.com).
2.  Click **"New +"** -> **"Web Service"**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `fakejobai` (or your choice)
    *   **Region**: Closest to you (e.g., Singapore, Frankfurt, Oregon)
    *   **Branch**: `main` (or `master`)
    *   **Root Directory**: `.` (Leave empty or set to root)
    *   **Runtime**: **Python 3**
    *   **Build Command**: 
        ```bash
        pip install -r backend/requirements.txt
        ```
    *   **Start Command**:
        ```bash
        cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
        ```
    *   **Instance Type**: **Free**

### Step 3: Environment Variables
If you are using API keys (e.g., Google Gemini, OpenAI, Firebase), you must add them:
1.  Scroll down to **"Environment Variables"**.
2.  Add keys like:
    *   `GEMINI_API_KEY`: `your_key_here`
    *   `OPENAI_API_KEY`: `your_key_here` (if used)

### Step 4: Deploy
1.  Click **"Create Web Service"**.
2.  Render will start building your app. It may take a few minutes.
3.  Once "Live", you will get a URL like `https://fakejobai.onrender.com`.

---

## 🌐 Alternative: Vercel (Frontend) + Render (Backend)
If you want a faster CDN for your HTML/JS, you can host the Frontend on Vercel and Backend on Render.

1.  **Backend (Render)**: Follow the steps above.
2.  **Frontend (Vercel)**:
    *   Go to Vercel, "Add New Project", select your repo.
    *   **Framework Preset**: Other / HTML.
    *   **Root Directory**: `frontend`.
    *   **Update URL**: You will need to change your `js/*.js` files to point to the Render Backend URL instead of relative paths (e.g., change `/analyze/...` to `https://fakejobai.onrender.com/analyze/...`).

**Recommendation**: Stick to the **Unified Deployment** (Method 1) first. It's simpler and requires no code changes.

## ✅ Done!
Your project is now online with HTTPS and free hosting!
