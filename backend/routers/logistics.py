from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# --- MOCK DATA ---
attendance_history = [
    {
        "id": "att_1",
        "user_id": "usr_1",
        "date": "2026-11-15T08:30:00",
        "type": "check-in",
        "method": "qrcode",
        "location": "Auditorio Principal"
    },
    {
        "id": "att_2",
        "user_id": "usr_1",
        "date": "2026-11-15T13:00:00",
        "type": "check-out",
        "method": "qrcode",
        "location": "Auditorio Principal"
    }
]

# --- SCHEMAS ---
class AttendanceRecord(BaseModel):
    id: str
    user_id: str
    date: str
    type: str
    method: str
    location: Optional[str] = None

class AttendanceCreate(BaseModel):
    userId: str
    type: str # 'check-in' | 'check-out'
    method: str = 'staff_scan'

# --- ENDPOINTS ---

@router.get("/attendance/user/{user_id}", response_model=List[AttendanceRecord])
def get_user_attendance(user_id: str):
    """
    Obtener historial de asistencia de un usuario.
    """
    return [rec for rec in attendance_history if rec["user_id"] == user_id]

@router.post("/attendance")
def record_attendance(data: AttendanceCreate):
    """
    Registrar asistencia (Mock).
    """
    new_record = {
        "id": f"att_{len(attendance_history) + 1}",
        "user_id": data.userId,
        "date": datetime.now().isoformat(),
        "type": data.type,
        "method": data.method,
        "location": "Sede Central"
    }
    attendance_history.append(new_record)
    return new_record

@router.post("/attendance/token/{day_id}")
def generate_day_token(day_id: str):
    """
    Generar token de asistencia para el día.
    """
    return {"token": f"daily_token_{day_id}_{datetime.now().strftime('%H%M')}", "valid_until": "18:00"}

@router.post("/attendance/verify-token")
def verify_token(token: str):
    """
    Verificar token de asistencia.
    """
    return {"valid": True, "message": "Token válido"}
