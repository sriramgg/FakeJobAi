from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import uvicorn

# Try to import routes. Since app.py is in the backend folder, 
# it needs to find 'routes' which is a subfolder.
import sys
import os

# Get path of current file (backend/app.py)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

try:
    from routes import int_routes, analyze, chat
except ImportError:
    # Fallback for different execution contexts
    try:
        from .routes import int_routes, analyze, chat
    except ImportError:
        # Last resort: try to add the parent dir to path if needed
        PARENT_DIR = os.path.dirname(CURRENT_DIR)
        if PARENT_DIR not in sys.path:
            sys.path.append(PARENT_DIR)
        from backend.routes import int_routes, analyze, chat

app = FastAPI(title="FakeJobAI API", version="1.0")

# --- Enable CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routes ---
app.include_router(int_routes.router)
app.include_router(analyze.router)
app.include_router(chat.router)

# --- Anti-Caching Middleware (Fast Fix for Hard Refresh Issue) ---
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    # Only disable cache for static assets or HTML
    if request.url.path.endswith((".html", ".css", ".js", ".png", ".jpg", ".svg")):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# --- Serve Frontend (Production Ready) ---
# This assumes 'frontend' folder is one level up from 'backend'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_path = os.path.join(BASE_DIR, "frontend")

if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {"message": "Welcome to FakeJobAI API 🚀 (Frontend not found at " + frontend_path + ")"}

if __name__ == "__main__":
    print("🚀 Starting FakeJobAI Backend...")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
