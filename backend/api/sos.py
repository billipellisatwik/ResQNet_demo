import logging
from fastapi import APIRouter, HTTPException
from database.firebase import get_db, save_db
from utils.validation import SOSCreate, StatusUpdate, LocationUpdate
from utils.helpers import generate_id, current_time
from services.priority import calculate_priority
from services.dispatch import find_nearest_available_unit
from services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter()

CATEGORY_ICONS = {
    "Flood Emergency": "🌊",
    "Medical Emergency": "🚑",
    "Fire Emergency": "🔥",
    "Person Trapped": "🆘",
    "Building Collapse": "🏢",
    "Food / Water Shortage": "🍲",
    "General Emergency": "🚨"
}

@router.post("")
@router.post("/")
async def create_sos(sos: SOSCreate):
    db = get_db()
    data = sos.dict()
    
    # Handle category & fallback category icon
    category = data.get("category") or data.get("type") or "General Emergency"
    icon = data.get("category_icon") or CATEGORY_ICONS.get(category, "🚨")
    
    # Location coordinates
    lat = data.get("latitude")
    lng = data.get("longitude")
    if lat is None and data.get("location"):
        lat = data["location"].get("lat")
        lng = data["location"].get("lng")
    
    if lat is None or lng is None:
        lat, lng = 17.3850, 78.4867
        
    accuracy = min(data.get("accuracy") or 5.0, 8.0)
    loc_type = data.get("location_type") or "GPS ACCURATE"

    # Find closest available rescue unit for this problem area
    nearest_unit = find_nearest_available_unit({"lat": float(lat), "lng": float(lng)}, max_radius_km=30.0)
    
    # Requested services processing: If empty or None -> CRITICAL URGENT (ALL SERVICES DISPATCHED)
    req_services = data.get("requested_services") or []
    if not req_services or "ALL_SERVICES" in req_services or len(req_services) == 0:
        req_services = ["ALL SERVICES DISPATCHED (Medical + Rescue Boat + Food + Shelter)"]
        is_all = True
    else:
        is_all = False

    sos_record = {
        "id": generate_id("RESQ"),
        "category": category,
        "category_icon": icon,
        "description": data.get("description", "Emergency SOS Signal"),
        "people_count": data.get("people_count", 1),
        "latitude": float(lat),
        "longitude": float(lng),
        "accuracy": float(accuracy),
        "location_type": loc_type,
        "phone": data.get("phone", "+91 Mobile"),
        "citizen_name": data.get("citizen_name", "Citizen Mobile Client"),
        "created_at": current_time(),
        "status": "pending",
        "priority": "CRITICAL" if is_all else "HIGH",
        "priority_score": 100 if is_all else 85,
        "requested_services": req_services,
        "is_all_services": is_all,
        "urgency_badge": "🚨 CRITICAL: ALL SERVICES DISPATCHED" if is_all else f"📦 Needed: {', '.join(req_services)}",
        "assigned_unit": nearest_unit["id"] if nearest_unit else None,
        "assigned_unit_name": nearest_unit["name"] if nearest_unit else None,
        "assigned_unit_distance_km": nearest_unit["distance_km"] if nearest_unit else None,
        "assigned_unit_eta_mins": nearest_unit["eta_minutes"] if nearest_unit else None,
        "nearest_unit_id": nearest_unit["id"] if nearest_unit else None,
        "nearest_unit_name": nearest_unit["name"] if nearest_unit else None,
        "nearest_unit_distance_km": nearest_unit["distance_km"] if nearest_unit else None,
        "nearest_unit_eta_mins": nearest_unit["eta_minutes"] if nearest_unit else None,
        "outcome": None
    }
    
    sos_list = db.setdefault("sos", [])
    sos_list.insert(0, sos_record)
    save_db()
    
    await ws_manager.broadcast_event("sos_created", sos_record)
    return {"message": "SOS created successfully", "data": sos_record}

@router.post("/mesh_sync")
async def mesh_sync(payload: dict):
    """
    Accepts batch array of peer-to-peer mesh relayed packets (ResQ-Mesh).
    Registers emergency signals uploaded by offline mesh nodes.
    """
    db = get_db()
    sos_list = db.setdefault("sos", [])
    packets = payload.get("mesh_packets", [])
    synced_count = 0
    synced_records = []

    for pkt in packets:
        sos_data = pkt.get("payload", pkt)
        sos_id = sos_data.get("id") or generate_id("RESQ")
        
        # Check if already in DB
        existing = next((item for item in sos_list if item["id"] == sos_id), None)
        if not existing:
            lat = sos_data.get("latitude", 17.3850)
            lng = sos_data.get("longitude", 78.4867)
            category = sos_data.get("category", "General Emergency")
            icon = CATEGORY_ICONS.get(category, "🚨")
            
            nearest_unit = find_nearest_available_unit({"lat": float(lat), "lng": float(lng)}, max_radius_km=30.0)
            
            new_record = {
                "id": sos_id,
                "category": category,
                "category_icon": icon,
                "description": sos_data.get("description", "Emergency signal via ResQ-Mesh P2P Relay"),
                "people_count": sos_data.get("people_count", 1),
                "latitude": float(lat),
                "longitude": float(lng),
                "accuracy": sos_data.get("accuracy", 5.0),
                "location_type": "🌐 P2P MESH RELAYED",
                "phone": sos_data.get("phone", "+91 Mobile"),
                "citizen_name": sos_data.get("citizen_name", "Offline Citizen"),
                "created_at": sos_data.get("timestamp") or current_time(),
                "status": "pending",
                "priority": sos_data.get("priority", "CRITICAL"),
                "priority_score": 95,
                "assigned_unit": nearest_unit["id"] if nearest_unit else None,
                "assigned_unit_name": nearest_unit["name"] if nearest_unit else None,
                "assigned_unit_distance_km": nearest_unit["distance_km"] if nearest_unit else None,
                "assigned_unit_eta_mins": nearest_unit["eta_minutes"] if nearest_unit else None,
                "nearest_unit_id": nearest_unit["id"] if nearest_unit else None,
                "nearest_unit_name": nearest_unit["name"] if nearest_unit else None,
                "nearest_unit_distance_km": nearest_unit["distance_km"] if nearest_unit else None,
                "nearest_unit_eta_mins": nearest_unit["eta_minutes"] if nearest_unit else None,
                "mesh_relayed": True,
                "mesh_hops": pkt.get("hops", 1),
                "mesh_id": pkt.get("mesh_id", "MESH-001")
            }
            sos_list.insert(0, new_record)
            synced_count += 1
            synced_records.append(new_record)
            
            # Broadcast WebSocket notification to EOC Command Center
            await ws_manager.broadcast_event("sos_created", new_record)

    save_db()
    return {
        "message": f"Successfully synced {synced_count} P2P mesh-relayed packets to EOC Command Center.",
        "synced_count": synced_count,
        "records": synced_records
    }

@router.get("")
@router.get("/")
def get_sos_list():
    db = get_db()
    return {"success": True, "data": db.get("sos", [])}

@router.get("/{sos_id}")
def get_sos(sos_id: str):
    db = get_db()
    sos_list = db.get("sos", [])
    item = next((item for item in sos_list if item["id"] == sos_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="SOS record not found")
    return {"success": True, "data": item}

@router.post("/{sos_id}/reached")
async def mark_team_reached(sos_id: str):
    db = get_db()
    sos_list = db.get("sos", [])
    found = next((item for item in sos_list if item["id"] == sos_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="SOS record not found")
        
    found["status"] = "reached"
    found["team_reached_at"] = current_time()
    save_db()
    
    event_data = {
        "id": sos_id,
        "status": "reached",
        "message": "RESCUE TEAM HAS REACHED YOUR LOCATION"
    }
    await ws_manager.broadcast_event("team_reached", event_data)
    await ws_manager.broadcast_event("status_update", event_data)
    return {"message": "Status updated to reached", "data": found}

@router.post("/{sos_id}/safe")
async def mark_person_safe(sos_id: str):
    db = get_db()
    sos_list = db.get("sos", [])
    found = next((item for item in sos_list if item["id"] == sos_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="SOS record not found")
        
    found["status"] = "safe"
    found["outcome"] = "RESCUED_BY_RESQNET_TEAM"
    found["safe_at"] = current_time()
    
    if found.get("assigned_unit"):
        unit_id = found["assigned_unit"]
        units = db.get("units", [])
        u_obj = next((u for u in units if u["id"] == unit_id or u["name"] == unit_id), None)
        if u_obj:
            u_obj["status"] = "available"
            u_obj["assigned_incident_id"] = None

    save_db()
    
    event_data = {
        "id": sos_id,
        "status": "safe",
        "outcome": "RESCUED_BY_RESQNET_TEAM",
        "message": "PERSON RESCUED AND MARKED SAFE"
    }
    await ws_manager.broadcast_event("person_safe", event_data)
    await ws_manager.broadcast_event("status_update", event_data)
    return {"message": "Person marked safe and assigned rescue team released", "data": found}

@router.post("/{sos_id}/report_rescued")
async def report_rescued_by_citizen(sos_id: str):
    db = get_db()
    sos_list = db.get("sos", [])
    found = next((item for item in sos_list if item["id"] == sos_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="SOS record not found")
        
    found["citizen_reported_rescued"] = True
    found["verification_required"] = True
    found["status"] = "citizen_reported_rescued"
    save_db()
    
    event_data = {
        "id": sos_id,
        "status": "citizen_reported_rescued",
        "verification_required": True,
        "message": "Citizen reports already rescued by others. Verification required by EOC."
    }
    await ws_manager.broadcast_event("citizen_reported_rescued", event_data)
    await ws_manager.broadcast_event("status_update", event_data)
    return {"message": "Safety report sent to Command Center for verification", "data": found}

@router.post("/{sos_id}/confirm_rescued_by_others")
async def confirm_rescued_by_others(sos_id: str):
    db = get_db()
    sos_list = db.get("sos", [])
    found = next((item for item in sos_list if item["id"] == sos_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="SOS record not found")
        
    found["status"] = "safe"
    found["outcome"] = "RESCUED_BY_OTHERS"
    found["citizen_reported_rescued"] = True
    found["verification_required"] = False
    found["safe_at"] = current_time()
    
    if found.get("assigned_unit"):
        unit_id = found["assigned_unit"]
        units = db.get("units", [])
        u_obj = next((u for u in units if u["id"] == unit_id or u["name"] == unit_id), None)
        if u_obj:
            u_obj["status"] = "available"
            u_obj["assigned_incident_id"] = None

    save_db()
    
    event_data = {
        "id": sos_id,
        "status": "safe",
        "outcome": "RESCUED_BY_OTHERS",
        "message": "Safety report verified by Command Center. Assigned rescue unit released."
    }
    await ws_manager.broadcast_event("rescued_by_others_confirmed", event_data)
    await ws_manager.broadcast_event("status_update", event_data)
    return {"message": "Confirmed rescued by others and released assigned team", "data": found}

@router.post("/{sos_id}/still_needs_help")
async def report_still_needs_help(sos_id: str):
    db = get_db()
    sos_list = db.get("sos", [])
    found = next((item for item in sos_list if item["id"] == sos_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="SOS record not found")
        
    found["status"] = "assigned"
    found["outcome"] = "STILL_NEEDS_HELP"
    found["citizen_reported_rescued"] = False
    found["verification_required"] = False
    save_db()
    
    event_data = {
        "id": sos_id,
        "status": "assigned",
        "outcome": "STILL_NEEDS_HELP",
        "message": "TEAM EN ROUTE — HELP STILL REQUIRED"
    }
    await ws_manager.broadcast_event("still_needs_help", event_data)
    await ws_manager.broadcast_event("status_update", event_data)
    return {"message": "Help requirement confirmed; rescue team remains en route", "data": found}
