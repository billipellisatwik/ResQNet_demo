import os
import json
import logging
from config import settings

logger = logging.getLogger(__name__)

DB_FILE = os.path.join(os.path.dirname(__file__), "db.json")

# Initial Seed Data with Regional Multi-Hub Rescue Units across major locations
DEFAULT_DB = {
    "sos": [
        {
            "id": "RESQ-1042",
            "category": "Flood Emergency",
            "category_icon": "🌊",
            "priority": "CRITICAL",
            "priority_score": 9,
            "status": "pending",
            "description": "Four family members trapped on roof due to fast rising flood waters",
            "citizen_name": "Ramesh Kumar",
            "phone": "+91 98765 43210",
            "latitude": 17.3850,
            "longitude": 78.4867,
            "accuracy": 12.0,
            "location_type": "GPS ACCURATE",
            "timestamp": "2026-08-18T10:00:00Z",
            "assigned_unit": None
        },
        {
            "id": "RESQ-1043",
            "category": "Medical Emergency",
            "category_icon": "🚑",
            "priority": "CRITICAL",
            "priority_score": 8,
            "status": "assigned",
            "description": "Elderly patient having acute respiratory distress, needs oxygen immediately",
            "citizen_name": "Priya Sharma",
            "phone": "+91 98123 45678",
            "latitude": 17.4000,
            "longitude": 78.5000,
            "accuracy": 15.0,
            "location_type": "GPS ACCURATE",
            "timestamp": "2026-08-18T10:05:00Z",
            "assigned_unit": "RU-002"
        }
    ],
    "incidents": [
        {"id": "INC-001", "type": "Flood", "severity": "high", "status": "active", "location": {"lat": 17.385, "lng": 78.4867}}
    ],
    "rescue_units": [
        {
            "id": "RU-001",
            "name": "Team Alpha (Hyderabad Central Base)",
            "type": "Flood Rescue & Boat Unit",
            "icon": "🚤",
            "status": "available",
            "contact": "+91 90000 11111",
            "location": {"lat": 17.3750, "lng": 78.4700},
            "assigned_incident_id": None
        },
        {
            "id": "RU-002",
            "name": "Team Beta (Secunderabad Hub)",
            "type": "Emergency Medical Corps",
            "icon": "🚑",
            "status": "busy",
            "contact": "+91 90000 22222",
            "location": {"lat": 17.4000, "lng": 78.5000},
            "assigned_incident_id": "RESQ-1043"
        },
        {
            "id": "RU-003",
            "name": "Team Gamma (Hitec City Station)",
            "type": "Fire & Extrication Unit",
            "icon": "🚒",
            "status": "available",
            "contact": "+91 90000 33333",
            "location": {"lat": 17.4100, "lng": 78.4600},
            "assigned_incident_id": None
        },
        {
            "id": "RU-004",
            "name": "Team Delta (Cyberabad Rescue Squad)",
            "type": "Heavy Rescue & Collapse Squad",
            "icon": "🏗️",
            "status": "available",
            "contact": "+91 90000 44444",
            "location": {"lat": 17.3600, "lng": 78.5100},
            "assigned_incident_id": None
        },
        {
            "id": "RU-DELHI",
            "name": "NDRF Delhi NCR Regional Hub",
            "type": "Rapid Disaster Response Force",
            "icon": "🚑",
            "status": "available",
            "contact": "+91 11 2345 6789",
            "location": {"lat": 28.6315, "lng": 77.2167},
            "assigned_incident_id": None
        },
        {
            "id": "RU-MUMBAI",
            "name": "SDRF Mumbai Coastal & Disaster Unit",
            "type": "Flood & Marine Extrication Squad",
            "icon": "🚤",
            "status": "available",
            "contact": "+91 22 2200 1122",
            "location": {"lat": 18.9438, "lng": 72.8234},
            "assigned_incident_id": None
        },
        {
            "id": "RU-BLR",
            "name": "Karnataka Emergency Fire & Rescue Base",
            "type": "Urban Evacuation Squad",
            "icon": "🚒",
            "status": "available",
            "contact": "+91 80 2297 1500",
            "location": {"lat": 12.9756, "lng": 77.6066},
            "assigned_incident_id": None
        },
        {
            "id": "RU-KOL",
            "name": "West Bengal SDRF Eastern Hub",
            "type": "Cyclone & Flood Response Unit",
            "icon": "🚤",
            "status": "available",
            "contact": "+91 33 2214 5400",
            "location": {"lat": 22.5532, "lng": 88.3524},
            "assigned_incident_id": None
        },
        {
            "id": "RU-CHE",
            "name": "Tamil Nadu Coastal Emergency Station",
            "type": "Medical & Water Rescue Corps",
            "icon": "🚑",
            "status": "available",
            "contact": "+91 44 2844 7788",
            "location": {"lat": 13.0418, "lng": 80.2341},
            "assigned_incident_id": None
        }
    ],
    "shelters": [
        {
            "id": "SH-001",
            "name": "Central High Community Shelter",
            "capacity": 500,
            "occupancy": 142,
            "available_beds": 358,
            "status": "Open",
            "address": "MG Road, Zone 3",
            "contact": "+91 40 2345 6789",
            "location": {"lat": 17.3900, "lng": 78.4900},
            "amenities": ["Medical Bay", "Clean Water", "Food Supplies", "Backup Power", "Sanitation"]
        },
        {
            "id": "SH-002",
            "name": "NTR Indoor Stadium Relief Hub",
            "capacity": 1200,
            "occupancy": 480,
            "available_beds": 720,
            "status": "Open",
            "address": "Stadium Road, Zone 1",
            "contact": "+91 40 2345 9999",
            "location": {"lat": 17.4050, "lng": 78.4800},
            "amenities": ["Medical Bay", "Clean Water", "Food Supplies", "Child Care", "Helipad"]
        },
        {
            "id": "SH-003",
            "name": "St. Mary's School Evacuation Center",
            "capacity": 350,
            "occupancy": 310,
            "available_beds": 40,
            "status": "Nearly Full",
            "address": "Secunderabad Main, Zone 4",
            "contact": "+91 40 2777 1122",
            "location": {"lat": 17.4300, "lng": 78.5100},
            "amenities": ["Clean Water", "Food Supplies", "Basic First Aid"]
        }
    ],
    "resources": [
        {"id": "RES-001", "name": "Inflatable Rescue Boats", "quantity": 15, "available": 8, "type": "Equipment"},
        {"id": "RES-002", "name": "Portable Oxygen Concentrators", "quantity": 40, "available": 18, "type": "Medical"},
        {"id": "RES-003", "name": "Emergency Food Packets (10k)", "quantity": 500, "available": 320, "type": "Ration"},
        {"id": "RES-004", "name": "Water Purification Systems", "quantity": 25, "available": 12, "type": "Sanitation"}
    ],
    "users": [
        {"username": "citizen", "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQYq", "role": "citizen"},
        {"username": "admin", "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQYq", "role": "admin"},
        {"username": "rescue", "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQYq", "role": "rescue"}
    ]
}

_db_data = None

def load_db():
    global _db_data
    if _db_data is None:
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    _db_data = json.load(f)
            except Exception as e:
                logger.error(f"Error loading DB file: {e}")
                _db_data = DEFAULT_DB.copy()
        else:
            _db_data = DEFAULT_DB.copy()
            save_db()
    return _db_data

def save_db():
    global _db_data
    if _db_data is not None:
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(_db_data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving DB file: {e}")

def get_db():
    return load_db()
