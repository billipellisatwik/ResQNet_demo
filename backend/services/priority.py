def calculate_priority(sos_data):
    type_weights = {"Medical": 5, "Fire": 5, "Flood": 4, "Police": 3, "Other": 2}
    base_score = type_weights.get(sos_data.get("type", "Other"), 2)
    
    desc = sos_data.get("description", "").lower()
    if any(word in desc for word in ["unconscious", "bleeding", "trapped", "heart"]):
        base_score += 3
    elif any(word in desc for word in ["urgent", "fast", "critical"]):
        base_score += 2
        
    if base_score > 7:
        return "critical"
    elif base_score > 4:
        return "high"
    elif base_score > 2:
        return "medium"
    return "low"
