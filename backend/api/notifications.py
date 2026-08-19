from fastapi import APIRouter

router = APIRouter()

@router.post("/send")
def send_notification(message: str, target: str):
    return {"message": "Notification sent", "data": {"target": target, "message": message}}
