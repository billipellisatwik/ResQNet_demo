from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class Location(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = None
    location_type: Optional[str] = "GPS ACCURATE"

class SOSCreate(BaseModel):
    category: str
    category_icon: Optional[str] = "🚨"
    type: Optional[str] = None # Backwards compatibility
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[Location] = None
    accuracy: Optional[float] = 15.0
    location_type: Optional[str] = "GPS ACCURATE"
    description: Optional[str] = None
    citizen_name: Optional[str] = "Anonymous Citizen"
    phone: Optional[str] = "N/A"
    requested_services: Optional[List[str]] = None

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    location_type: Optional[str] = "GPS ACCURATE"

class StatusUpdate(BaseModel):
    status: str
    assigned_unit: Optional[str] = None

class RescueDispatch(BaseModel):
    incident_id: Optional[str] = None
    sos_id: Optional[str] = None
    unit_id: Optional[str] = None
    unit_name: Optional[str] = None


class IncidentCreate(BaseModel):
    type: str
    severity: str
    location: Location
    description: Optional[str] = None

class RescueUnitCreate(BaseModel):
    name: str
    type: str
    location: Location

class ShelterCreate(BaseModel):
    name: str
    capacity: int
    location: Location

class ResourceCreate(BaseModel):
    name: str
    quantity: int
    type: str

