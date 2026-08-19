from fastapi import APIRouter
from database.firebase import get_db
from utils.validation import IncidentCreate
from utils.helpers import generate_id, current_time
from services.recommendation import get_recommendations

router = APIRouter()

@router.post("/")
def create_incident(incident: IncidentCreate):
    db = get_db()
    incident_data = incident.dict()
    incident_data["id"] = generate_id("INC")
    incident_data["timestamp"] = current_time()
    incident_data["status"] = "active"
    incident_data["recommendations"] = get_recommendations(incident.type, incident.severity)
    
    db["incidents"].append(incident_data)
    return {"message": "Incident created", "data": incident_data}

@router.get("/")
def get_incidents():
    return {"data": get_db()["incidents"]}
