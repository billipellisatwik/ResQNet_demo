from fastapi import APIRouter
from services.analytics_service import get_dashboard_stats

router = APIRouter()

@router.get("/dashboard")
def dashboard_stats():
    return {"data": get_dashboard_stats()}
