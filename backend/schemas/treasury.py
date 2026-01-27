from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- CONTRIBUTIONS ---
class ContributionOut(BaseModel):
    id: int
    organizador_id: str
    organizador_nombre: str
    mes: str
    mes_label: str
    monto_esperado: float
    estado: str
    comprobante: Optional[str] = None
    fecha_pago: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ContributionPayment(BaseModel):
    organizadorId: str
    meses: List[str]
    accountId: Optional[int] = None
    amount: float
    voucher: Optional[str] = None
    isValidation: bool = False

class ContributionValidation(BaseModel):
    organizadorId: str
    meses: List[str]
    accountId: Optional[int] = None

class ContributionRejection(BaseModel):
    organizadorId: str
    meses: List[str]
    reason: Optional[str] = None

# --- PRESUPUESTO ---
class BudgetPlanOut(BaseModel):
    id: int
    categoria: str
    presupuestado: float
    
    class Config:
        from_attributes = True

class BudgetUpdate(BaseModel):
    category: str
    amount: float

# --- MULTAS ---
class FineOut(BaseModel):
    id: int
    userId: str
    amount: float
    reason: str
    estado: str
    createdAt: datetime
    paidAt: Optional[datetime] = None
    voucher: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

class FineValidation(BaseModel):
    accountId: int

class FineRejection(BaseModel):
    reason: Optional[str] = None

class FineUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    voucher: Optional[str] = None
    paidAt: Optional[datetime] = None

# --- TRANSFERENCIAS ---
class TransferCreate(BaseModel):
    fromId: int
    toId: int
    amount: float
    description: str
