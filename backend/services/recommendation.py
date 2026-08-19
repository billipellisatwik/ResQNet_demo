def get_recommendations(incident_type, severity):
    recs = []
    if incident_type.lower() == "flood":
        recs.append("Deploy boats and water rescue teams.")
        if severity in ["high", "critical"]:
            recs.append("Evacuate immediate low-lying areas.")
            recs.append("Alert nearby shelters for influx.")
    elif incident_type.lower() == "fire":
        recs.append("Dispatch fire engines.")
        recs.append("Alert medical for potential smoke inhalation or burns.")
    else:
        recs.append("Assess situation on arrival.")
    return recs
