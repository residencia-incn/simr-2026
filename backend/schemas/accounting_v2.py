from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

class PaymentStatus(str, Enum):
    PENDIENTE = "PENDIENTE"
    PENDING = "PENDIENTE"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ANULADO = "ANULADO"

class ContributionStatus(str, Enum):
    PENDIENTE = "PENDIENTE"
    PENDING = "PENDIENTE"
    IN_PROCESS = "IN_PROCESS"
    PAID = "PAID"

# --- CONFIGURATION ---
class ConfigCreate(BaseModel):
    year: int
    monthly_fee: Decimal
    start_month: date
    end_month: date
    payment_deadline_day: int

class ConfigOut(ConfigCreate):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

# --- CONTRIBUTIONS & PENALTIES ---
class ContributionOut(BaseModel):
    id: int
    month_date: date
    amount: Decimal
    status: str
    month: str # Display name
    year: int
    class Config:
        from_attributes = True

class PenaltyOut(BaseModel):
    id: int
    reason: str
    amount: Decimal
    status: str
    class Config:
        from_attributes = True

class OrganizerMatrixItem(BaseModel):
    id: str
    name: str
    contributions: List[ContributionOut]
    penalties: List[PenaltyOut]
    total_due: Decimal = Decimal(0)

# --- PAYMENTS ---
class PaymentCreate(BaseModel):
    user_id: str
    contribution_ids: List[int] = []
    penalty_ids: List[int] = []
    amount: Decimal
    method: str = "TRANSFERENCIA"
    voucher_url: Optional[str] = None

class PaymentTransactionOut(BaseModel):
    id: int
    user_id: str
    amount: Decimal
    status: PaymentStatus
    voucher_url: Optional[str] = None
    payment_date: datetime
    payment_method: str
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    class Config:
        from_attributes = True

# --- STATS & ANALYTICS ---
class ChartDataItem(BaseModel):
    name: str
    value: float
    
    @classmethod
    def validate_name(cls, v):
        return str(v) if v is not None else "Desconocido"

class TreasuryStatsOut(BaseModel):
    summary: dict # {total_income, total_expenses, balance}
    contributions: dict # {paid_count, pending_count, groups: []}
    penalties: dict # {tardanza_count, falta_count, other_count}
    registrationsByModality: List[ChartDataItem]
    workshopInscriptions: List[ChartDataItem]
    expenseDistribution: List[ChartDataItem]
    class Config:
        from_attributes = True
