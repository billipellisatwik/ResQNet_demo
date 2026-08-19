import uuid
from datetime import datetime

def generate_id(prefix="RESQ"):
    return f"{prefix}-{str(uuid.uuid4())[:8].upper()}"

def current_time():
    return datetime.utcnow().isoformat()
