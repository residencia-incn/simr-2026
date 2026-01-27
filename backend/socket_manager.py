from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # meeting_id -> List of WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, meeting_id: int):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append(websocket)
        print(f"📡 Nuevo cliente WS conectado a la reunión {meeting_id}")

    def disconnect(self, websocket: WebSocket, meeting_id: int):
        if meeting_id in self.active_connections:
            if websocket in self.active_connections[meeting_id]:
                self.active_connections[meeting_id].remove(websocket)
                print(f"🔌 Cliente WS desconectado de la reunión {meeting_id}")
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def broadcast_to_meeting(self, meeting_id: int, message: dict):
        if meeting_id in self.active_connections:
            connections = self.active_connections[meeting_id]
            print(f"📡 BROADCAST a Meeting {meeting_id} | Payload: {message.get('type')} | Suscriptores: {len(connections)}")
            for i, connection in enumerate(connections):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"⚠️ Error enviando mensaje WS al cliente #{i}: {e}")
                    # Limpieza silenciosa se encargará en el disconnect si falla
                    pass
        else:
             print(f"⚠️ BROADCAST FALLIDO: No hay conexiones activas para Meeting {meeting_id}")


manager = ConnectionManager()
