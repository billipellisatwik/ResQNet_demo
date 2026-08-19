import math
from database.firebase import get_db, save_db
from utils.helpers import generate_id

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def calculate_distance(loc1, loc2):
    """
    Returns accurate Haversine distance in kilometers.
    """
    lat1 = loc1.get("lat") or loc1.get("latitude") or 0.0
    lon1 = loc1.get("lng") or loc1.get("longitude") or 0.0
    lat2 = loc2.get("lat") or loc2.get("latitude") or 0.0
    lon2 = loc2.get("lng") or loc2.get("longitude") or 0.0
    return haversine_distance(lat1, lon1, lat2, lon2)

def detect_region_name(lat, lng):
    """
    Determines local city/district regional name based on exact latitude & longitude.
    """
    if 17.2 <= lat <= 17.6 and 78.2 <= lng <= 78.7:
        return "Hyderabad Central"
    elif 17.6 <= lat <= 18.1 and 83.0 <= lng <= 83.5:
        return "Visakhapatnam Coastal"
    elif 16.3 <= lat <= 16.7 and 80.4 <= lng <= 80.9:
        return "Vijayawada Regional"
    elif 13.4 <= lat <= 13.8 and 79.2 <= lng <= 79.6:
        return "Tirupati Emergency"
    elif 17.8 <= lat <= 18.2 and 79.4 <= lng <= 79.8:
        return "Warangal Express"
    elif 28.4 <= lat <= 28.9 and 77.0 <= lng <= 77.5:
        return "Delhi NCR"
    elif 18.8 <= lat <= 19.3 and 72.7 <= lng <= 73.2:
        return "Mumbai Disaster"
    elif 12.8 <= lat <= 13.2 and 77.4 <= lng <= 77.8:
        return "Bengaluru Urban"
    elif 12.9 <= lat <= 13.3 and 80.1 <= lng <= 80.5:
        return "Chennai Coastal"
    elif 22.3 <= lat <= 22.8 and 88.2 <= lng <= 88.6:
        return "Kolkata Eastern"
    else:
        lat_str = f"{abs(lat):.2f}°{'N' if lat>=0 else 'S'}"
        lng_str = f"{abs(lng):.2f}°{'E' if lng>=0 else 'W'}"
        return f"Local District Squad ({lat_str}, {lng_str})"

def rank_units_by_proximity(location, max_radius_km=12.0):
    """
    Ranks all rescue units by Haversine proximity to the citizen's exact emergency location.
    Only units within max_radius_km (12 km) are marked is_nearby=True.
    """
    db = get_db()
    units = db.get("rescue_units", [])
    
    ranked_units = []
    for unit in units:
        unit_loc = unit.get("location", {})
        dist_km = calculate_distance(location, unit_loc)
        # Rapid Response ETA: 1-3 mins MAX
        eta_mins = max(1, min(3, int(round(dist_km * 0.5 + 1))))
        
        ranked_units.append({
            **unit,
            "distance_km": round(dist_km, 2),
            "eta_minutes": eta_mins,
            "is_nearby": dist_km <= max_radius_km
        })
        
    ranked_units.sort(key=lambda u: u["distance_km"])
    return ranked_units

def get_or_create_local_unit(location):
    """
    Ensures a rapid LOCAL emergency rescue unit is deployed near the citizen's exact location.
    If no registered unit exists within 12 km of citizen's coordinates, dynamically creates 
    a local regional rescue squad stationed 0.35 km away from the citizen's exact coordinates.
    """
    db = get_db()
    units = db.get("rescue_units", [])
    
    citizen_lat = location.get("lat") or location.get("latitude") or 17.3850
    citizen_lng = location.get("lng") or location.get("longitude") or 78.4867
    
    # Check if an available unit already exists within 12km
    for unit in units:
        unit_loc = unit.get("location", {})
        dist_km = calculate_distance(location, unit_loc)
        if dist_km <= 12.0 and unit.get("status") == "available":
            return unit

    # Dynamically position a local regional unit 0.35 km near citizen
    unit_id = generate_id("RU-LOCAL")
    region_name = detect_region_name(citizen_lat, citizen_lng)
    
    base_lat = citizen_lat + 0.003
    base_lng = citizen_lng + 0.003
    
    local_unit = {
        "id": unit_id,
        "name": f"NDRF {region_name} Express Squad",
        "type": "Local Rapid Disaster Response Unit",
        "icon": "⚡",
        "status": "available",
        "contact": "+91 Local Emergency Line",
        "location": {"lat": round(base_lat, 5), "lng": round(base_lng, 5)},
        "assigned_incident_id": None
    }
    
    units.append(local_unit)
    save_db()
    return local_unit

def find_nearest_available_unit(location, unit_type=None, max_radius_km=12.0):
    """
    Finds the single closest LOCAL available rescue unit to the citizen's exact location.
    Enforces ultra-fast 1-3 minute ETA response mode across all emergency dispatches.
    """
    ranked_units = rank_units_by_proximity(location, max_radius_km=12.0)
    
    for unit in ranked_units:
        if unit.get("status") == "available" and unit.get("is_nearby"):
            if unit_type and unit.get("type") != unit_type:
                continue
            return unit

    local_unit = get_or_create_local_unit(location)
    dist_km = calculate_distance(location, local_unit["location"])
    eta_mins = max(1, min(3, int(round(dist_km * 0.5 + 1))))
    
    return {
        **local_unit,
        "distance_km": round(dist_km, 2),
        "eta_minutes": eta_mins,
        "is_nearby": True
    }
