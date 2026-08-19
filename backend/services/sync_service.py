def sync_offline_data(offline_data):
    from database.firebase import get_db
    db = get_db()
    
    processed = 0
    for record in offline_data:
        if record.get("collection") == "sos":
            db["sos"].append(record.get("data"))
            processed += 1
    return {"status": "success", "synced_records": processed}
