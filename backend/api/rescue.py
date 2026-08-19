import logging
from fastapi import APIRouter, HTTPException, Query
from database.firebase import get_db, save_db
from utils.validation import RescueDispatch
from services.dispatch import rank_units_by_proximity, calculate_distance, find_nearest_available_unit
from services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("")
@router.get("/")
def get_rescue_units():
    db = get_db()
    return {"data": db.get("rescue_units", [])}

@router.get("/nearest")
def get_nearest_rescue_units(
    lat: float = Query(..., description="Latitude of emergency area"),
    lng: float = Query(..., description="Longitude of emergency area"),
    max_radius: float = Query(30.0, description="Max radius in km")
):
    """
    Returns rescue units ranked strictly by closest proximity to the emergency location.
    Units farther than max_radius are marked is_nearby=False.
    """
    location = {"lat": lat, "lng": lng}
    ranked = rank_units_by_proximity(location, max_radius_km=max_radius)
    return {"data": ranked}

@router.post("/dispatch")
async def dispatch_unit(payload: RescueDispatch):
    db = get_db()
    sos_list = db.get("sos", [])
    rescue_units = db.get("rescue_units", [])

    target_inc_id = payload.incident_id or payload.sos_id
    target_unit_id = payload.unit_id or payload.unit_name

    incident = next((s for s in sos_list if s["id"] == target_inc_id), None)
    if not incident and sos_list:
        incident = sos_list[0]

    unit = next((u for u in rescue_units if u["id"] == target_unit_id or u["name"] == target_unit_id), None)
    if not unit and rescue_units:
        unit = rescue_units[0]

    if not incident:
        raise HTTPException(status_code=404, detail="Incident/SOS record not found")
    if not unit:
        raise HTTPException(status_code=404, detail="Rescue unit not found")

    # Compute exact Haversine distance from Unit to Incident
    unit_loc = unit.get("location", {"lat": 17.3850, "lng": 78.4867})
    inc_loc = {"lat": incident["latitude"], "lng": incident["longitude"]}
    
    dist_km = calculate_distance(inc_loc, unit_loc)
    eta_mins = max(2, int(round(dist_km * 2.5 + 2)))

    # Update states
    incident["status"] = "assigned"
    incident["assigned_unit"] = unit["id"]
    unit["status"] = "dispatched"
    unit["assigned_incident_id"] = incident["id"]

    # Calculate route waypoints from Unit position to Incident position
    unit_lat, unit_lng = unit_loc["lat"], unit_loc["lng"]
    inc_lat, inc_lng = inc_loc["lat"], inc_loc["lng"]

    # Generate intermediate route waypoints for Leaflet map animation
    waypoints = [
        [unit_lat, unit_lng],
        [unit_lat + (inc_lat - unit_lat) * 0.25 + 0.002, unit_lng + (inc_lng - unit_lng) * 0.25 - 0.001],
        [unit_lat + (inc_lat - unit_lat) * 0.50 - 0.001, unit_lng + (inc_lng - unit_lng) * 0.50 + 0.002],
        [unit_lat + (inc_lat - unit_lat) * 0.75 + 0.001, unit_lng + (inc_lng - unit_lng) * 0.75],
        [inc_lat, inc_lng]
    ]

    save_db()

    dispatch_event = {
        "incident_id": incident["id"],
        "unit_id": unit["id"],
        "unit_name": unit["name"],
        "unit_type": unit["type"],
        "unit_icon": unit.get("icon", "🚑"),
        "waypoints": waypoints,
        "eta_minutes": eta_mins,
        "distance_km": round(dist_km, 2),
        "is_nearby": dist_km <= 30.0
    }

    logger.info(f"Dispatched {unit['name']} ({dist_km:.1f}km away) to incident {incident['id']}")

    # Broadcast WebSocket event to Command Center & Citizen Tracking
    await ws_manager.broadcast_event("rescue_dispatched", dispatch_event)
    await ws_manager.broadcast_event("status_update", {
        "id": incident["id"],
        "status": "assigned",
        "assigned_unit": unit["name"]
    })

    return {
        "message": f"Unit {unit['name']} ({dist_km:.1f} km away) successfully dispatched to SOS {incident['id']}",
        "data": dispatch_event
    }
