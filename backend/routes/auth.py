# backend/routes/auth.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/auth")
def auth_home():
    return {"message": "Auth endpoint"}
