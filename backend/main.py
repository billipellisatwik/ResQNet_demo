import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from api import sos, incidents, rescue, shelters, resources, weather, analytics, notifications, auth
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(sos.router, prefix=f"{settings.API_V1_STR}/sos", tags=["sos"])
app.include_router(incidents.router, prefix=f"{settings.API_V1_STR}/incidents", tags=["incidents"])
app.include_router(rescue.router, prefix=f"{settings.API_V1_STR}/rescue", tags=["rescue"])
app.include_router(shelters.router, prefix=f"{settings.API_V1_STR}/shelters", tags=["shelters"])
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/resources", tags=["resources"])
app.include_router(weather.router, prefix=f"{settings.API_V1_STR}/weather", tags=["weather"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])

@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "demo_mode": settings.DEMO_MODE,
        "app": settings.PROJECT_NAME,
        "services": {
            "fastapi": "ONLINE",
            "firestore": "DEMO_MODE",
            "websocket": "ONLINE",
            "weather_api": "ONLINE"
        }
    }

from services.websocket_manager import ws_manager

@app.websocket("/ws/{client_type}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_type: str, client_id: str):
    await ws_manager.connect(websocket, client_type, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_json = json.loads(data)
                event_type = msg_json.get("type", "client_message")
                payload = msg_json.get("payload", msg_json)
                await ws_manager.broadcast_event(event_type, payload)
            except Exception:
                await ws_manager.broadcast_event("client_text", {"client_id": client_id, "text": data})
    except WebSocketDisconnect:
        ws_manager.disconnect(client_id)
        await ws_manager.broadcast_event("client_left", {"client_id": client_id, "type": client_type})

# Mount static files & PWA assets
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@app.get("/manifest.json")
def get_manifest():
    manifest_path = os.path.join(base_dir, "manifest.json")
    if os.path.exists(manifest_path):
        return FileResponse(manifest_path, media_type="application/json")
    raise HTTPException(status_code=404, detail="Manifest not found")

@app.get("/service-worker.js")
def get_sw():
    sw_path = os.path.join(base_dir, "service-worker.js")
    if os.path.exists(sw_path):
        return FileResponse(sw_path, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="Service worker not found")

dirs_to_mount = [
    ("/css", "css", False),
    ("/js", "js", False),
    ("/assets", "assets", False),
    ("/translations", "translations", False),
    ("/frontend", "frontend", True),
    ("/", "frontend", True)
]

for path, folder, is_html in dirs_to_mount:
    full_path = os.path.join(base_dir, folder)
    if os.path.exists(full_path):
        app.mount(path, StaticFiles(directory=full_path, html=is_html), name=folder)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
