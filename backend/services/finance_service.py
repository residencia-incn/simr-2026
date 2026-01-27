from sqlalchemy.orm import Session
from models import FinancialRecord, TransactionType, PaymentStatus, Penalty, Meeting
import datetime
from fastapi import HTTPException

def create_penalty(db: Session, user_id: str, amount: float, concept: str, origin_id: int):
    """
    Crea un registro de deuda (multa) para el usuario.
    """
    record = FinancialRecord(
        user_id=user_id,
        amount=amount,
        concept=concept,
        type=TransactionType.PENALIDAD,
        status=PaymentStatus.PENDIENTE,
        origin_source="MEETING",
        origin_id=origin_id,
        created_at=datetime.datetime.now()
    )
    db.add(record)
    
    # [NEW] Consistency: Also create a Penalty record for Treasury visibility
    try:
         # Penalty doesn't have meeting_id/origin_id (Design flaw), so we put it in concept?
         # Or relies on fuzzy match.
         penalty = Penalty(
            user_id=user_id,
            amount=amount,
            concept=concept,
            status="PENDING",
            created_at=datetime.datetime.now()
         )
         db.add(penalty)
    except Exception as e:
         print(f"Warning: Could not create mirror Penalty: {e}")
         pass

def void_penalty(db: Session, user_id: str, origin_id: int):
    """
    Anula cualquier multa activa asociada a esta reunión para este usuario.
    """
    records = db.query(FinancialRecord).filter(
        FinancialRecord.user_id == user_id,
        FinancialRecord.origin_id == origin_id,
        FinancialRecord.type == TransactionType.PENALIDAD,
        FinancialRecord.status == PaymentStatus.PENDIENTE
    ).all()
    
    for record in records:
        record.status = PaymentStatus.ANULADO
        record.updated_at = datetime.datetime.now()
    meeting = db.query(Meeting).get(origin_id)
    if meeting:
        search_term = meeting.title
    else:
        # Fallback: Try to guess format or void all PENDING simple matching?
        # Best effort: nothing
        return

    # Fuzzy match concept since Penalty lacks meeting_id (Design Flaw workaround)
    penalties = db.query(Penalty).filter(
        Penalty.user_id == user_id,
        Penalty.status == "PENDING", # Only pending can be voided
        Penalty.concept.contains(search_term)
    ).all()
    
    for p in penalties:
        # Payment Lock Check (Double safety, though status=PENDING should cover it)
        if p.payment_id: 
                raise HTTPException(400, "La multa ya ha sido pagada o está en proceso. No se puede anular.")
        
        p.status = "ANULADO"
        # No updated_at field in Penalty model based on previous read, skipping
