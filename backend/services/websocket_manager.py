import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ResQWebSocketManager:
    def __init__(self):
        # Map of client_id -> WebSocket connection info
        self.connections: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, client_type: str, client_id: str):
        await websocket.accept()
        self.connections[client_id] = {
            "socket": websocket,
            "type": client_type,
            "id": client_id
        }
        logger.info(f"WebSocket client connected: {client_id} (type: {client_type})")
        
        # Send welcome connection acknowledgment
        await self.send_to_client(client_id, "connection_established", {
            "status": "connected",
            "client_id": client_id,
            "client_type": client_type
        })

    def disconnect(self, client_id: str):
        if client_id in self.connections:
            del self.connections[client_id]
            logger.info(f"WebSocket client disconnected: {client_id}")

    async def send_to_client(self, client_id: str, event_type: str, payload: dict):
        if client_id in self.connections:
            ws_info = self.connections[client_id]
            try:
                msg = json.dumps({"type": event_type, "payload": payload})
                await ws_info["socket"].send_text(msg)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast_event(self, event_type: str, payload: dict, client_type_filter: str = None):
        """
        Broadcast a structured event to all active clients or filtered by client_type.
        """
        msg = json.dumps({"type": event_type, "payload": payload})
        disconnected = []

        for cid, info in list(self.connections.items()):
            if client_type_filter is None or info["type"] == client_type_filter:
                try:
                    await info["socket"].send_text(msg)
                except Exception as e:
                    logger.error(f"Error broadcasting to {cid}: {e}")
                    disconnected.append(cid)

        for cid in disconnected:
            self.disconnect(cid)

ws_manager = ResQWebSocketManager()
