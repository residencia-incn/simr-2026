from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, ForwardRef
from datetime import datetime, date, time
import enum

class MeetingStatus(str, enum.Enum):
    PROGRAMADA = "PROGRAMADA"
    EN_CURSO = "EN_CURSO"
    FINALIZADA = "FINALIZADA"   # Se cerró la sesión, inicia conteo de 15 min
    CERRADA = "CERRADA"         # Pasaron los 15 min, nadie más firma

class AttendanceStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PRESENTE = "PRESENTE"
    TARDANZA = "TARDANZA"       # Multa S/ 10.00
    FALTA = "FALTA"             # Multa S/ 20.00
    JUSTIFICADA = "JUSTIFICADA"

class TransactionType(str, enum.Enum):
    INSCRIPCION = "INSCRIPCION"
    TALLER = "TALLER"
    PENALIDAD = "PENALIDAD"
    APORTE_MENSUAL = "APORTE_MENSUAL"

class PaymentStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"
    ANULADO = "ANULADO"

class TaskPriority(str, enum.Enum):
    BAJA = "BAJA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"

class TaskStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    EN_PROGRESO = "EN_PROGRESO"
    COMPLETADA = "COMPLETADA"

# --- MeetingAgreement ---
class AgreementBase(BaseModel):
    content: str
    level: int = 0
    parent_id: Optional[int] = None
    assigned_user_id: Optional[str] = None
    deadline: Optional[datetime] = None
    is_completed: bool = False

# Forward Reference for recursive schema
AgreementCreateRef = ForwardRef('AgreementCreate')

class AgreementCreate(AgreementBase):
    children: Optional[List[AgreementCreateRef]] = []

class AgreementOut(AgreementBase):
    id: int
    children: List['AgreementOut'] = []
    class Config:
        from_attributes = True

# Required for recursive models in Pydantic v2
AgreementCreate.model_rebuild()
AgreementOut.model_rebuild()

# --- MeetingAttendance ---
class AttendanceBase(BaseModel):
    user_id: str
    status: Optional[AttendanceStatus] = AttendanceStatus.PENDIENTE
    is_justified: bool = False
    notes: Optional[str] = None

class AttendanceOut(AttendanceBase):
    meeting_id: int
    check_in_time: Optional[datetime] = None
    signed_at: Optional[datetime] = None
    signature_hash: Optional[str] = None
    user_name: Optional[str] = None # Para el UI
    justification_reason: Optional[str] = None 
    penalty_status: Optional[str] = None # 'PENDING', 'PAID', 'ANULADO', or None
    class Config:
        from_attributes = True

class JustificationSchema(BaseModel):
    reason: str

# --- Meeting ---
class MeetingBase(BaseModel):
    title: str
    scheduled_start: datetime

class MeetingCreate(MeetingBase):
    invited_user_ids: List[str] = []

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    status: Optional[MeetingStatus] = None
    agreements: Optional[List[AgreementCreate]] = None
    next_meeting_agenda: Optional[List[dict]] = None
    invited_user_ids: Optional[List[str]] = None
    is_preview_active: Optional[bool] = None
    next_meeting_id: Optional[int] = None

class MeetingOut(MeetingBase):
    id: int
    real_start_time: Optional[datetime] = None
    real_end_time: Optional[datetime] = None
    status: MeetingStatus
    created_by: str
    is_preview_active: bool = False
    next_meeting_id: Optional[int] = None
    
    agreements: List[AgreementOut] = []
    next_meeting_agenda: Optional[List[dict]] = []
    attendances: List[AttendanceOut] = []
    
    @validator("agreements", pre=True)
    def filter_roots(cls, v):
        if isinstance(v, list):
            return [
                a for a in v 
                if (getattr(a, 'parent_id', None) is None if not isinstance(a, dict) else a.get('parent_id') is None)
            ]
        return v
    
    class Config:
        from_attributes = True

# --- FinancialRecord ---
class FinancialRecordOut(BaseModel):
    id: int
    user_id: str
    amount: float
    concept: str
    type: TransactionType
    status: PaymentStatus
    created_at: datetime
    origin_source: Optional[str] = None
    origin_id: Optional[int] = None
    class Config:
        from_attributes = True

# --- Task ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: str
    deadline: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIA
    status: TaskStatus = TaskStatus.PENDIENTE
    progress: int = 0

class TaskCreate(TaskBase):
    meeting_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    progress: Optional[int] = None
    comment: Optional[str] = None # Para agregar al historial

class TaskProgressUpdate(BaseModel):
    progress: int = Field(ge=0, le=100)
    status: TaskStatus
    comment: Optional[str] = None

class TaskOut(TaskBase):
    id: int
    meeting_id: int
    assigned_by: Optional[str] = None
    comments: List[dict] = []
    class Config:
        from_attributes = True
