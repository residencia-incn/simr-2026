from fastapi import APIRouter, Depends, HTTPException, status, Body, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional
from datetime import date, datetime
from decimal import Decimal

from database import get_db
import models
import schemas.accounting_v2 as schemas_v2
import oauth2
import utils
from utils import get_peru_time

router = APIRouter(prefix="/accounting-v2", tags=["Accounting V2"])

# --- CONFIGURATION ENDPOINTS ---

@router.get("/config", response_model=schemas_v2.ConfigOut)
def get_config(db: Session = Depends(get_db)):
    config = db.query(models.AccountingConfig).filter_by(is_active=True).first()
    if not config:
        # Create default config if none exists
        config = models.AccountingConfig(
            year=2026,
            monthly_fee=Decimal("50.00"),
            payment_deadline_day=29,
            start_month=date(2026, 1, 1),
            end_month=date(2026, 6, 1)
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.post("/config", response_model=schemas_v2.ConfigOut)
def update_config(data: schemas_v2.ConfigCreate, db: Session = Depends(get_db)):
    config = db.query(models.AccountingConfig).filter(models.AccountingConfig.year == data.year).first()
    if config:
        for key, value in data.dict().items():
            setattr(config, key, value)
    else:
        config = models.AccountingConfig(**data.dict())
        db.add(config)
    db.commit()
    db.refresh(config)
    return config

# --- PLAN INITIALIZATION ---

@router.post("/initialize-plan")
def initialize_plan(
    year: int = 2026,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Genera la matriz de deudas para todos los organizadores activos."""
    is_authorized = (
        current_user.eventRole in ["admin", "organizador"] or 
        current_user.isSuperAdmin or
        (current_user.modules and ("contabilidad" in current_user.modules or "accounting" in current_user.modules or "treasury" in current_user.modules))
    )
    
    if not is_authorized:
        raise HTTPException(status_code=403, detail="No tienes permisos de Tesorería")

    config = db.query(models.AccountingConfig).filter(models.AccountingConfig.year == year).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración anual no encontrada")
    
    # Logic to fetch ALL organizers (primary role OR in roles list)
    all_users = db.query(models.User).all()
    organizers = []
    for u in all_users:
        if u.eventRole == "organizador":
            organizers.append(u)
        elif u.roles and isinstance(u.roles, list) and "organizador" in u.roles:
            organizers.append(u)
    created_count = 0
    
    # Range of months
    curr = config.start_month
    while curr <= config.end_month:
        for org in organizers:
            # Check existence
            exists = db.query(models.Contribution).filter(
                models.Contribution.user_id == org.id,
                models.Contribution.month_date == curr
            ).first()
            
            if not exists:
                new_c = models.Contribution(
                    user_id=org.id,
                    month_date=curr,
                    amount=config.monthly_fee,
                    status=models.ContributionStatus.PENDING
                )
                db.add(new_c)
                created_count += 1
        
        # Advance month
        if curr.month == 12:
            curr = date(curr.year + 1, 1, 1)
        else:
            curr = date(curr.year, curr.month + 1, 1)
            
    db.commit()
    return {"msg": f"Plan inicializado. {created_count} nuevas cuotas generadas."}

# --- DASHBOARD MATRIX ---

@router.get("/dashboard-matrix", response_model=List[schemas_v2.OrganizerMatrixItem])
def get_matrix(db: Session = Depends(get_db)):
    """Data para la tabla principal: Usuarios vs Meses + Multas"""
    try:
        # Get active config to filter months
        config = db.query(models.AccountingConfig).filter_by(is_active=True).first()

        # Logic to fetch ALL organizers (primary role OR in roles list)
        # Using python filtering to handle complex JSONB/JSON differences across DBs safely
        all_users = db.query(models.User).filter(models.User.eventRole == "organizador").all()
        
        # Also fetch users with roles in JSON (if not already fetched)
        # This is a bit heavy but safe for small user bases. 
        # Ideally use db.query(models.User).filter(models.User.roles.contains(["organizador"])) if PG
        secondary_users = db.query(models.User).filter(models.User.eventRole != "organizador").all()
        
        organizers = list(all_users)
        for u in secondary_users:
            if u.roles and isinstance(u.roles, list) and "organizador" in u.roles:
                organizers.append(u)
        matrix = []
        
        month_names = {
            1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"
        }

        for u in organizers:
            # Filter contributions by period if config exists
            query = db.query(models.Contribution).filter(models.Contribution.user_id == u.id)
            if config:
                query = query.filter(
                    models.Contribution.month_date >= config.start_month,
                    models.Contribution.month_date <= config.end_month
                )
            contribs = query.order_by(models.Contribution.month_date).all()

            penalties = db.query(models.Penalty).filter(
                models.Penalty.user_id == u.id,
                models.Penalty.status != "ANULADO" 
            ).all()
            
            total_due = Decimal(0)
            formatted_contribs = []
            for c in contribs:
                if c.status == models.ContributionStatus.PENDING:
                    total_due += Decimal(str(c.amount))
                formatted_contribs.append({
                    "id": c.id,
                    "month_date": c.month_date,
                    "amount": c.amount,
                    "status": c.status,
                    "month": month_names.get(c.month_date.month, "N/A"),
                    "year": c.month_date.year,
                    "payment_id": c.payment_id
                })

            formatted_penalties = []
            for p in penalties:
                if p.status == "PENDING":
                    total_due += Decimal(str(p.amount))
                formatted_penalties.append({
                    "id": p.id,
                    "reason": p.concept, # Map concept -> reason for frontend compatibility
                    "amount": p.amount,
                    "status": p.status,
                    "payment_id": p.payment_id
                })
            
            matrix.append({
                "id": u.id,
                "name": f"{u.firstName} {u.lastName}",
                "contributions": formatted_contribs,
                "penalties": formatted_penalties,
                "total_due": total_due
            })
        return matrix
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Accounting Error: {str(e)}")

@router.get("/health")
def health_check():
    """Simple health check to verify router is active."""
    return {"status": "ok", "module": "accounting_v2"}

@router.get("/stats", response_model=schemas_v2.TreasuryStatsOut)
def get_treasury_stats(db: Session = Depends(get_db)):
    """Consolida todas las métricas para el Resumen de Tesorería."""
    try:
        # 1. Summary (Incomes/Expenses)
        total_income = db.query(func.sum(models.Income.amount)).scalar() or Decimal(0)
        # Egresos are transactions of type 'expense'
        total_expenses = db.query(func.sum(models.Transaction.total_amount))\
            .filter(models.Transaction.status == "approved")\
            .scalar() or Decimal(0)
            
        # FORCE FLOAT CONVERSION BEFORE MATH
        # Transaction.total_amount is Float, Income.amount is DECIMAL
        val_income = float(total_income)
        val_expenses = float(total_expenses)
        balance = val_income - val_expenses
        
        # 2. Contributions
        paid_contribs = db.query(models.Contribution).filter(models.Contribution.status == models.ContributionStatus.PAID).count()
        pending_contribs = db.query(models.Contribution).filter(models.Contribution.status == models.ContributionStatus.PENDING).count()
        
        # 3. Penalties
        # Use python-side filtering for like/ilike to stay safe with sqlite
        all_penalties = db.query(models.Penalty).all()
        tardanza_count = sum(1 for p in all_penalties if "tardanza" in (p.concept or "").lower())
        falta_count = sum(1 for p in all_penalties if "falta" in (p.concept or "").lower())
        other_count = len(all_penalties) - (tardanza_count + falta_count)
        
        # 4. Registrations by Modality (Use simple group by or python aggregation)
        # Python aggregation is safer for JSON/mixed DBs
        
        # Better: Query modalities and count users
        modalities = db.query(models.RegistrationModality).all()
        registrationsByModality = []
        for m in modalities:
            count = db.query(models.User).filter(models.User.modality_id == m.id).count()
            name_val = m.title or m.code or "Modalidad Desconocida"
            registrationsByModality.append(schemas_v2.ChartDataItem(name=str(name_val), value=float(count)))
            
        # 5. Workshop Demand
        # Needs to parse User.workshops JSON array. 
        # Python-side is safest for SQLite without JSON extension
        all_users_ws = db.query(models.User).all()
        ws_counts = {}
        all_workshops = {ws.id: ws.name for ws in db.query(models.Workshop).all()}

        for u in all_users_ws:
            if u.workshops and isinstance(u.workshops, list):
                for ws_id in u.workshops:
                    # Clean the ID if needed (sometimes it's int or string)
                    ws_name = all_workshops.get(str(ws_id), f"Taller {ws_id}")
                    # Ensure not None
                    if not ws_name: ws_name = f"Taller {ws_id}"
                    ws_counts[ws_name] = ws_counts.get(ws_name, 0) + 1
        
        workshopInscriptions = [schemas_v2.ChartDataItem(name=str(name), value=float(count)) for name, count in ws_counts.items()]

        # 6. Expense Distribution (Compatible con SQLite y Postgres)
        # Fetch all approved expenses with their snapshot
        approved_expenses = db.query(models.Transaction).filter(
            models.Transaction.status == "approved", 
            models.Transaction.total_amount > 0
        ).all()

        category_sums = {}
        
        for tx in approved_expenses:
            cat_name = "Sin Categoría"
            snapshot = tx.items_snapshot
            
            # Try to extract category from snapshot dict
            if snapshot and isinstance(snapshot, dict):
                cat_name = snapshot.get("category", "Sin Categoría")
            elif snapshot and isinstance(snapshot, str):
                 # Fallback if stored as string
                 cat_name = "Sin Categoría"
            
            # Or checking existing categories
            if cat_name == "Sin Categoría" and hasattr(tx, 'category') and tx.category:
                 cat_name = tx.category
            
            # Ensure not None
            if not cat_name: cat_name = "Sin Categoría"
            
            category_sums[cat_name] = category_sums.get(cat_name, 0.0) + float(tx.total_amount)

        expenseDistribution = [
            schemas_v2.ChartDataItem(name=str(name), value=val) 
            for name, val in category_sums.items()
        ]

        return {
            "summary": {
                "total_income": val_income,
                "total_expenses": val_expenses,
                "balance": balance
            },
            "contributions": {
                "paid_count": paid_contribs,
                "pending_count": pending_contribs
            },
            "penalties": {
                "tardanza_count": tardanza_count,
                "falta_count": falta_count,
                "other_count": other_count
            },
            "registrationsByModality": registrationsByModality,
            "workshopInscriptions": workshopInscriptions,
            "expenseDistribution": expenseDistribution
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stats Error: {str(e)}")

# --- PAYMENT PROCESSING ---

@router.post("/pay")
def register_payment(
    user_id: str = Form(...),
    contribution_ids: str = Form("[]"), # JSON string
    penalty_ids: str = Form("[]"),      # JSON string
    amount: Decimal = Form(...),
    method: str = Form("TRANSFERENCIA"),
    voucher: UploadFile = File(None),
    voucher_url: Optional[str] = Form(None), # [FIX] Allow string URL from cloud
    target_account_id: int = Form(None), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
) -> Dict:
    """
    Registra un pago secuencialmente controlado con subida de voucher real.
    """
    import json
    try:
        c_ids = json.loads(contribution_ids)
        p_ids = json.loads(penalty_ids)
    except:
        c_ids = []
        p_ids = []

    # 1. Validar Secuencialidad
    if c_ids:
        targets = db.query(models.Contribution).filter(
            models.Contribution.id.in_(c_ids),
            models.Contribution.user_id == user_id
        ).order_by(models.Contribution.month_date).all()
        
        if targets:
            first_target_date = targets[0].month_date
            pending_before = db.query(models.Contribution).filter(
                models.Contribution.user_id == user_id,
                models.Contribution.month_date < first_target_date,
                models.Contribution.status != models.ContributionStatus.PAID
            ).count()
            
            if pending_before > 0:
                raise HTTPException(status_code=400, detail="Debe pagar los meses anteriores en orden cronológico.")

    # 2. Manejo de Voucher (Priorizar URL de Cloud si existe)
    final_voucher_url = voucher_url
    if voucher:
        # Extraer DNI del user_id para el nombre del archivo si es posible
        dni_prefix = user_id.split("_")[-1] if "_" in user_id else user_id
        final_voucher_url = utils.save_voucher_file(voucher, dni_prefix)
    
    # Debug para asegurar que no se pierda el voucher_url
    if not final_voucher_url and not voucher:
        print(f"⚠️ Alerta: Registro de pago sin voucher recibido para {user_id}")

    # Si es el Tesorero (Admin/Special role) haciendo el pago de alguien, es APPROVED
    # Si es el usuario mismo subiendo su voucher, es PENDING
    # Auto-approve if user is SuperAdmin OR has access to Accounting/Treasury module
    # and has the "admin" or "organizador" eventRole.
    is_treasurer = (
        current_user.isSuperAdmin or 
        (current_user.modules and ("contabilidad" in current_user.modules or "treasury" in current_user.modules)) or
        (current_user.eventRole in ["admin", "tesorero"])
    )
    
    # Use string values directly to avoid Enum mismatch in DB
    initial_status = "APPROVED" if is_treasurer else "PENDIENTE"
    
    # 3. Crear Transacción
    new_payment = models.PaymentTransaction(
        user_id=user_id,
        amount=amount,
        status=initial_status,
        payment_method=method,
        voucher_url=final_voucher_url,
        bank_account_id=target_account_id, # [FIX] Guardar cuenta destino
        verified_by=current_user.id if initial_status == "APPROVED" else None,
        verified_at=get_peru_time() if initial_status == "APPROVED" else None
    )
    db.add(new_payment)
    db.flush()
    
    # 4. Actualizar Items
    # Fixed: Compare with string "APPROVED"
    item_status = models.ContributionStatus.PAID if initial_status == "APPROVED" else models.ContributionStatus.IN_PROCESS
    
    if c_ids:
        db.query(models.Contribution).filter(models.Contribution.id.in_(c_ids))\
            .update({"status": item_status, "payment_id": new_payment.id}, synchronize_session=False)
            
    if p_ids:
        db.query(models.Penalty).filter(models.Penalty.id.in_(p_ids))\
            .update({"status": str(item_status.value if hasattr(item_status, 'value') else item_status), "payment_id": new_payment.id}, synchronize_session=False)

    # 5. Libro de caja (Incomes)
    # 5. Libro de caja (Incomes) - Granular Registration
    if initial_status == "APPROVED":
        # 5.1 Contributions
        if c_ids:
            contribs = db.query(models.Contribution).filter(models.Contribution.id.in_(c_ids)).all()
            for c in contribs:
                # Month Label
                month_label = "Mensualidad"
                try:
                    if c.month_date:
                        # Spanish month names mapping
                        spanish_months = {
                            1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
                            7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
                        }
                        month_label = spanish_months.get(c.month_date.month, c.month_date.strftime("%B"))
                except:
                    pass
                
                clean_concept = f"Aporte Mes {month_label}"
                
                # Determine Account (Use same logic as validate_voucher or default to first for now)
                # The payment object doesn't have account_id passed in explicitly? 
                # models.PaymentTransaction doesn't seem to store target account, but the request `payment` might have?
                # The schemas_v2.PaymentCreate has generic fields. 
                # Ideally, we should receive account_id in the request or derive it.
                # Use default logic if not available.
                
                # Target Account Logic (Prioritize request, then settings, then fallback fund_dest)
                final_target_id = target_account_id
                if not final_target_id:
                    # Check Global Settings first (Aportes Mensuales)
                    setting = db.query(models.SystemSetting).filter_by(key="default_contribution_account").first()
                    if setting and setting.value:
                        final_target_id = int(setting.value)
                    
                    if not final_target_id:
                        fund_config = None
                        for key in ["Aporte Mensual", "AportesMensuales", "Inscripciones"]:
                            fund_config = db.query(models.FundDestination).filter(models.FundDestination.income_type == key).first()
                            if fund_config: 
                                break
                        final_target_id = fund_config.target_account_id if fund_config else None

                db.add(models.Income(
                    amount=c.amount,
                    category="Aporte Mensual",
                    concept=clean_concept,
                    bank_account_id=final_target_id,
                    origin_payment_id=new_payment.id,
                    created_at=get_peru_time()
                ))

        # 5.2 Penalties
        if p_ids:
            penalties = db.query(models.Penalty).filter(models.Penalty.id.in_(p_ids)).all()
            for p in penalties:
                clean_concept = f"Penalidad {p.concept or 'General'}"
                
                final_target_id = target_account_id
                if not final_target_id:
                    fund_config = db.query(models.FundDestination).filter(models.FundDestination.income_type == "Penalidades").first()
                    final_target_id = fund_config.target_account_id if fund_config else None

                db.add(models.Income(
                    amount=p.amount,
                    category="Penalidades",
                    concept=clean_concept,
                    bank_account_id=final_target_id,
                    origin_payment_id=new_payment.id,
                    created_at=get_peru_time()
                ))

        # 5.3 Fallback for manual amount without items (Edge case)
        if not c_ids and not p_ids and amount > 0:
             db.add(models.Income(
                amount=amount,
                category=models.IncomeCategory.CONTRIBUTION,
                concept=f"Aporte Directo (Sin detalle)", 
                bank_account_id=target_account_id,
                origin_payment_id=new_payment.id,
                created_at=get_peru_time()
            ))

    db.commit()
    return {"msg": "Operación registrada", "status": initial_status, "payment_id": new_payment.id}

@router.post("/validate-voucher/{payment_id}")
def validate_voucher(
    payment_id: int,
    approve: bool = Body(..., embed=True),
    reason: str = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    is_authorized = (
        current_user.eventRole == "admin" or 
        current_user.isSuperAdmin or
        (current_user.modules and ("contabilidad" in current_user.modules or "accounting" in current_user.modules))
    )
    
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Solo tesorería puede validar")

    payment = db.query(models.PaymentTransaction).get(payment_id)
    if not payment or payment.status != "PENDIENTE":
        raise HTTPException(status_code=404, detail="Transacción pendiente no encontrada")

    if approve:
        payment.status = "APPROVED" 
        payment.verified_by = current_user.id
        payment.verified_at = get_peru_time()
        
        # Fetch User Name for Concept
        user_obj = db.query(models.User).filter(models.User.id == payment.user_id).first()
        user_name = f"{user_obj.firstName} {user_obj.lastName}" if user_obj else payment.user_id

        # Determine Target Account from Configuration (Prioritize Settings > FundDest)
        target_account_id = None
        setting = db.query(models.SystemSetting).filter_by(key="default_contribution_account").first()
        if setting and setting.value:
            target_account_id = int(setting.value)
            
        if not target_account_id:
            fund_config = None
            for key in ["Aporte Mensual", "AportesMensuales", "Inscripciones"]:
                fund_config = db.query(models.FundDestination).filter(models.FundDestination.income_type == key).first()
                if fund_config: 
                    break
            target_account_id = fund_config.target_account_id if fund_config else None
        
        # 1. Update & Register Income for Contributions (Granular)
        contribs = db.query(models.Contribution).filter(models.Contribution.payment_id == payment_id).all()
        for c in contribs:
            c.status = models.ContributionStatus.PAID
            
            # Month Label
            month_label = "Mensualidad"
            try:
                if c.month_date:
                    month_label = c.month_date.strftime("%B")
            except:
                pass
                
            clean_concept = f"Aporte {month_label}"
            
            # Create individual Income
            db.add(models.Income(
                amount=c.amount,
                category="Aporte Mensual", # Explicit Category
                concept=clean_concept,
                bank_account_id=target_account_id,
                origin_payment_id=payment.id,
                created_at=get_peru_time()
            ))

        # 2. Update & Register Income for Penalties (Granular)
        penalties = db.query(models.Penalty).filter(models.Penalty.payment_id == payment_id).all()
        for p in penalties:
            p.status = "PAID"
            
            clean_concept = f"Penalidad {p.concept or 'General'}"
            
            db.add(models.Income(
                amount=p.amount,
                category="Penalidades", # Corrected to Plural
                concept=clean_concept,
                bank_account_id=target_account_id,
                origin_payment_id=payment.id,
                created_at=get_peru_time()
            ))
            
        # If no items found (e.g. legacy/flat payment), we might want to register the total? 
        # But this function is for v2 which binds items. 
        # Safety check: if total_amount > 0 but no items, register generic income.
        if not contribs and not penalties and payment.amount > 0:
             db.add(models.Income(
                amount=payment.amount,
                category=models.IncomeCategory.CONTRIBUTION,
                concept=f"Aporte Validado (Genérico) - {user_name}",
                bank_account_id=target_account_id,
                origin_payment_id=payment.id,
                created_at=get_peru_time()
            ))
    else:
        payment.status = "REJECTED" # Fixed: Use string literal
        payment.rejection_reason = reason
        db.query(models.Contribution).filter(models.Contribution.payment_id == payment_id).update({"status": models.ContributionStatus.PENDING, "payment_id": None})
        db.query(models.Penalty).filter(models.Penalty.payment_id == payment_id).update({"status": "PENDING", "payment_id": None})

    db.commit()
    return {"msg": "Validación procesada"}
