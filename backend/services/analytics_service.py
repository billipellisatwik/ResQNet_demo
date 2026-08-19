from database.firebase import get_db

def get_dashboard_stats():
    db = get_db()
    sos_list = db.get("sos", [])
    units = db.get("rescue_units", [])
    shelters = db.get("shelters", [])
    
    active_sos = [s for s in sos_list if s["status"] in ["pending", "assigned", "dispatched", "en_route"]]
    critical_sos = [s for s in sos_list if s.get("priority") == "CRITICAL" and s["status"] != "resolved"]
    dispatched_units = [u for u in units if u["status"] in ["busy", "dispatched", "en_route"]]
    available_shelters = [s for s in shelters if s.get("status") == "Open"]
    
    return {
        "active_sos_count": len(active_sos),
        "total_sos_count": len(sos_list),
        "critical_priority_count": len(critical_sos),
        "dispatched_units_count": len(dispatched_units),
        "available_units_count": len(units) - len(dispatched_units),
        "open_shelters_count": len(available_shelters),
        "total_shelter_capacity": sum(s.get("capacity", 0) for s in shelters),
        "total_shelter_occupancy": sum(s.get("occupancy", 0) for s in shelters),
        "avg_response_time_minutes": 6.8
    }

