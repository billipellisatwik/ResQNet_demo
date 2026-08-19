from fastapi import APIRouter
from services.weather_service import get_current_weather

router = APIRouter()

@router.get("")
@router.get("/")
def get_weather(lat: float = 17.385, lng: float = 78.4867):
    return {"data": get_current_weather(lat, lng)}

