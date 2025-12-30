# backend/routes/retrain.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/retrain")
def retrain_home():
    return {"message": "Retrain endpoint"}
