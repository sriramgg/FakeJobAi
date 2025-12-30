from fastapi import APIRouter

router = APIRouter(prefix="/int")

@router.get("/status")
def status():
    return {"status": "Backend is running"}
