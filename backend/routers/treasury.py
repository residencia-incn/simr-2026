from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional
from datetime import datetime
import json

from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/treasury",
    tags=["Treasury Management"],
)

# ==========================
# 1. CONTRIBUCIONES (APORTES)
# ==========================

@router.get("/contributions", response_model=List[schemas.ContributionOut])
def get_contribution_plan(db: Session = Depends(get_db)):
    """Obtiene el plan de aportes mensual"""
    return db.query(models.ContributionPlan).all()

@router.post("/contributions/init", response_model=List[schemas.ContributionOut])
def initialize_contribution_plan(db: Session = Depends(get_db)):
    """Inicializa (o completa) el plan de aportes para todos los organizadores activos"""
    
    # 1. Obtener organizadores activos
    organizers = db.query(models.User).filter(models.User.role == "organizer", models.User.is_active == True).all()
    
    # 2. Definir meses del periodo (Enero - Diciembre 2026, por ejemplo, o desde la configuración)
    months = [
        {"id": "JAN", "label": "Enero"}, {"id": "FEB", "label": "Febrero"},
        {"id": "MAR", "label": "Marzo"}, {"id": "APR", "label": "Abril"},
        {"id": "MAY", "label": "Mayo"}, {"id": "JUN", "label": "Junio"},
        {"id": "JUL", "label": "Julio"}, {"id": "AUG", "label": "Agosto"},
        {"id": "SEP", "label": "Septiembre"}, {"id": "OCT", "label": "Octubre"},
        {"id": "NOV", "label": "Noviembre"}, {"id": "DEC", "label": "Diciembre"},
    ]
    
    # Default monto - intentar sacar de config, sino 0
    default_amount = 0
    setting = db.query(models.SystemSetting).filter_by(key="contribution_amount").first()
    if setting:
        try:
            default_amount = float(setting.value)
        except:
            pass
            
    created_count = 0
    
    for org in organizers:
        for month in months:
            # Check existence
            exists = db.query(models.ContributionPlan).filter_by(
                organizador_id=org.id, 
                mes=month["id"]
            ).first()
            
            if not exists:
                new_contrib = models.ContributionPlan(
                    organizador_id=org.id,
                    organizador_nombre=org.name,
                    mes=month["id"],
                    mes_label=month["label"],
                    monto_esperado=default_amount,
                    estado="pendiente"
                )
                db.add(new_contrib)
                created_count += 1
                
    db.commit()
    
    return db.query(models.ContributionPlan).all()

@router.post("/contributions/record")
def record_contribution(data: schemas.ContributionPayment, db: Session = Depends(get_db)):
    """Registra un pago de aporte (puede ser validación o marca directa)"""
    
    total_amount = data.amount
    
    # Validar que los items existan
    contribs = db.query(models.ContributionPlan).filter(
        models.ContributionPlan.organizador_id == data.organizadorId,
        models.ContributionPlan.mes.in_(data.meses)
    ).all()
    
    if not contribs:
        raise HTTPException(status_code=404, detail="No se encontraron los meses indicados")
        
    for c in contribs:
        c.estado = "validando" if data.isValidation else "pagado"
        c.comprobante = data.voucher
        c.voucheredAt = datetime.utcnow()
        if not data.isValidation:
            c.fecha_pago = datetime.utcnow()
            
    # Si es directo (no validacion), crear transacción (Opcional, o se crea al validar)
    # Por ahora solo actualizamos estado
            
    db.commit()
    return {"message": "Aporte registrado correctamente"}

@router.post("/contributions/validate")
def validate_contribution(data: schemas.ContributionValidation, db: Session = Depends(get_db)):
    """Aprueba un aporte en estado 'validando'"""
    
    contribs = db.query(models.ContributionPlan).filter(
        models.ContributionPlan.organizador_id == data.organizadorId,
        models.ContributionPlan.mes.in_(data.meses)
    ).all()
    
    if not contribs:
         raise HTTPException(status_code=404, detail="No se encontraron registros")
         
    total_amount = 0
    description_months = []
    
    for c in contribs:
        c.estado = "pagado"
        c.fecha_pago = datetime.utcnow()
        total_amount += c.monto_esperado
        description_months.append(c.mes_label)
        
    # Crear transacción de ingreso real
    if total_amount > 0 and data.accountId:
        transaction = models.FinancialTransaction(
            type="income",
            amount=total_amount,
            description=f"Aporte Organizador: {description_months}",
            category="Aporte Mensual",
            bank_account_id=data.accountId,
            recorded_by_id=data.organizadorId,
            date=datetime.utcnow()
        )
        db.add(transaction)
    
    db.commit()
    return {"message": "Aportes validados e ingreso registrado"}

@router.post("/contributions/reject")
def reject_contribution(data: schemas.ContributionRejection, db: Session = Depends(get_db)):
    """Rechaza un aporte"""
    contribs = db.query(models.ContributionPlan).filter(
        models.ContributionPlan.organizador_id == data.organizadorId,
        models.ContributionPlan.mes.in_(data.meses)
    ).all()
    
    for c in contribs:
        c.estado = "pendiente" # Regresar a pendiente
        # Guardar motivo de rechazo en algún log si es necesario
        
    db.commit()
    return {"message": "Aporte rechazado"}


# ==========================
# 2. PRESUPUESTO (BUDGET)
# ==========================

@router.get("/budget", response_model=List[schemas.BudgetPlanOut])
def get_budget_plan(db: Session = Depends(get_db)):
    """Obtiene la ejecución presupuestal"""
    return db.query(models.BudgetPlan).all()

@router.post("/budget")
def update_budget(data: schemas.BudgetUpdate, db: Session = Depends(get_db)):
    """Actualiza o crea una línea de presupuesto"""
    
    item = db.query(models.BudgetPlan).filter_by(categoria=data.category).first()
    
    if item:
        item.presupuestado = data.amount
    else:
        new_item = models.BudgetPlan(categoria=data.category, presupuestado=data.amount)
        db.add(new_item)
        
    db.commit()
    return {"message": "Presupuesto actualizado"}
    
@router.put("/budget")
def bulk_update_budget(budgets: List[schemas.BudgetUpdate], db: Session = Depends(get_db)):
    """Actualización masiva de presupuesto"""
    for b in budgets:
        item = db.query(models.BudgetPlan).filter_by(categoria=b.category).first()
        if item:
            item.presupuestado = b.amount
        else:
            db.add(models.BudgetPlan(categoria=b.category, presupuestado=b.amount))
    
    db.commit()
    return {"message": "Presupuestos actualizados"}


# ==========================
# 3. PENALIDADES (FINES)
# ==========================

@router.get("/fines", response_model=List[schemas.FineOut])
def get_fines(db: Session = Depends(get_db)):
    # Filtrar multas anuladas
    penalties = db.query(models.Penalty).filter(
        models.Penalty.status != "ANULADO",
        models.Penalty.status != "VOID"
    ).all()
    results = []
    for p in penalties:
        # Resolve payment info if exists
        payment = p.payment
        results.append({
            "id": p.id,
            "userId": p.user_id,
            "amount": float(p.amount),
            "reason": p.concept, # Updated from reason to concept
            "estado": str(p.status), # Updated from Enum logic to String
            "createdAt": p.created_at or datetime.utcnow(),
            "paidAt": payment.verified_at if payment else None,
            "voucher": payment.voucher_url if payment else None,
            "notes": None
        })
    return results

@router.post("/fines/{fine_id}/validate")
def validate_fine(fine_id: int, data: schemas.FineValidation, db: Session = Depends(get_db)):
    fine = db.query(models.Penalty).filter_by(id=fine_id).first()
    if not fine:
        raise HTTPException(status_code=404, detail="Multa no encontrada")
        
    # Update status
    fine.status = "PAID"
    
    # Crear transacción/pago ficticio para registrar el ingreso si no existe
    # Note: Logic adapted to match old behavior creating FinancialTransaction directly
    transaction = models.FinancialTransaction(
        type="income",
        amount=float(fine.amount),
        description=f"Pago Multa: {fine.reason}",
        category="Penalidades",
        bank_account_id=data.accountId,
        date=datetime.utcnow()
    )
    db.add(transaction)
    db.commit()
    return {"message": "Multa validada"}

@router.post("/fines/{fine_id}/reject")
def reject_fine(fine_id: int, data: schemas.FineRejection, db: Session = Depends(get_db)):
    fine = db.query(models.Penalty).filter_by(id=fine_id).first()
    if not fine:
        raise HTTPException(status_code=404, detail="Multa no encontrada")
        
    fine.status = "PENDING"
    fine.payment_id = None # Delink payment if any
    db.commit()
    return {"message": "Multa rechazada"}

@router.put("/fines/{fine_id}")
def update_fine_status(fine_id: int, data: schemas.FineUpdate, db: Session = Depends(get_db)):
    fine = db.query(models.Penalty).filter_by(id=fine_id).first()
    if not fine:
        raise HTTPException(status_code=404, detail="Multa no encontrada")
        
    # Map string status to Enum
    if data.status:
        try:
            # Simple mapping, assuming input matches enum values or simple strings
            if data.status.lower() in ['pagado', 'paid']:
                fine.status = "PAID"
            elif data.status.lower() in ['pendiente', 'pending']:
                fine.status = "PENDING"
            else:
                # Fallback or try direct assignment if enum permits
                pass 
        except:
            pass

    # Penalty model doesn't have notes/voucher directly, ignoring those for now
    # as they belong to PaymentTransaction in the new schema.
    
    db.commit()
    return {
        "id": fine.id,
        "userId": fine.user_id,
        "amount": float(fine.amount),
        "reason": fine.concept,
        "estado": str(fine.status),
        "createdAt": fine.created_at or datetime.utcnow(),
        "notes": None
    }
    
# ==========================
# TRANSFERENCIAS
# ==========================
@router.post("/transfer")
def make_transfer(data: schemas.TransferCreate, db: Session = Depends(get_db)):
    # 1. Check Accounts
    source = db.query(models.BankAccount).get(data.fromId)
    target = db.query(models.BankAccount).get(data.toId)
    
    if not source or not target:
        raise HTTPException(status_code=404, detail="Una de las cuentas no existe")

    # 2. Create Outgoing Transaction
    tx_out = models.FinancialTransaction(
        type="expense",
        amount=data.amount,
        description=f"Transferencia a {target.alias or target.holder_name}: {data.description}",
        category="Transferencia Interna",
        bank_account_id=source.id,
        date=datetime.utcnow()
    )
    
    # 3. Create Incoming Transaction
    tx_in = models.FinancialTransaction(
        type="income",
        amount=data.amount,
        description=f"Transferencia desde {source.alias or source.holder_name}: {data.description}",
        category="Transferencia Interna",
        bank_account_id=target.id,
        date=datetime.utcnow()
    )
    
    db.add(tx_out)
    db.add(tx_in)
    db.commit()
    return {"message": "Transferencia realizada"}
