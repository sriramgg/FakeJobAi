from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import int_routes, analyze, chat
import os

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

# --- Serve Frontend (Production Ready) ---
# This assumes 'frontend' folder is one level up from 'backend'
# Adjust path if files are moved during Docker build or deployment
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {"message": "Welcome to FakeJobAI API 🚀 (Frontend not found)"}

# uvicorn app:app --reload
