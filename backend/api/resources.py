from fastapi import APIRouter
from database.firebase import get_db

router = APIRouter()

@router.get("")
@router.get("/")
def get_resources():
    return {"data": get_db()["resources"]}
