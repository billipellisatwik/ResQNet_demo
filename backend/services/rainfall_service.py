def analyze_rainfall_risk(rainfall_mm):
    if rainfall_mm > 100:
        return "extreme risk", 9
    elif rainfall_mm > 50:
        return "high risk", 7
    elif rainfall_mm > 20:
        return "moderate risk", 4
    return "low risk", 1
