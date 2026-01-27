from fastapi import APIRouter, Depends, HTTPException, Body, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import models
import utils
import oauth2
from database import get_db
from datetime import datetime

router = APIRouter()

# Esquemas
class TransactionSchema(BaseModel):
    id: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    amount: float
    type: str # 'income' | 'expense'
    accountId: Optional[int] = None
    account: Optional[str] = None

class TransactionCreate(BaseModel):
    descripcion: str
    monto: float
    categoria: str
    cuenta_id: int
    type: str = "income" # 'income' | 'expense'
    fecha: Optional[str] = None

# --- ENDPOINTS CRÍTICOS ---

# 1. Dashboard Stats (Actualizado para usar BD real si es posible)
@router.get("/stats")
def get_accounting_stats(db: Session = Depends(get_db)):
    # Sumar Incomes
    total_income_reg = db.query(models.Income).with_entities(models.Income.amount).all()
    sum_income = sum([float(i[0]) for i in total_income_reg])
    
    # Sumar Financial Transactions
    fts = db.query(models.FinancialTransaction).all()
    for ft in fts:
        if ft.type == 'income':
            sum_income += ft.amount
        else:
            # Podríamos restar egresos aquí para el balance
            pass
            
    # Sumar Solicitudes de Inscripción + Transacciones de Pago V2 Pendientes
    count_registrations = db.query(models.RegistrationRequest).count()
    count_payments = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.status == "PENDIENTE").count()
            
    return {
        "totalIncome": sum_income,
        "totalExpenses": sum([ft.amount for ft in fts if ft.type == 'expense']),
        "balance": sum_income - sum([ft.amount for ft in fts if ft.type == 'expense']),
        "pendingCount": count_registrations + count_payments
    }

# 2. Configuración Contable
@router.get("/config")
def get_accounting_config():
    return {"currency": "PEN", "taxRate": 0.18, "fiscalYear": 2026}

# 3. Transacciones (Pag 9 PDF) - REAL IMPLEMENTATION
@router.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    try:
        from sqlalchemy.orm import aliased
        TransactionUser = aliased(models.User)
        
        # 1. Obtener ingresos de inscripciones (Models.Income) unido a Transaction y User para el nombre
        # Also joining PaymentTransaction for V2 payments
        PaymentTx = aliased(models.PaymentTransaction)
        PaymentUser = aliased(models.User)
        
        incomes = db.query(
            models.Income, 
            models.BankAccount, 
            models.FinancialInstitution,
            TransactionUser,
            PaymentUser,
            models.Transaction.voucher_url,
            PaymentTx.voucher_url
        ).outerjoin(
            models.BankAccount, models.Income.bank_account_id == models.BankAccount.id
        ).outerjoin(
            models.FinancialInstitution, models.BankAccount.institution_id == models.FinancialInstitution.id
        ).outerjoin(
            models.Transaction, models.Income.transaction_id == models.Transaction.id
        ).outerjoin(
            TransactionUser, models.Transaction.user_id == TransactionUser.id
        ).outerjoin(
            PaymentTx, models.Income.origin_payment_id == PaymentTx.id # Join V2 Payment
        ).outerjoin(
            PaymentUser, PaymentTx.user_id == PaymentUser.id # Join User via V2 Payment
        ).all()
        
        # 2. Obtener transacciones financieras manuales (Models.FinancialTransaction)
        # Verify model exists before querying
        financials = []
        if hasattr(models, 'FinancialTransaction'):
            FinancialUser = aliased(models.User)
            financials = db.query(models.FinancialTransaction, models.BankAccount, models.FinancialInstitution, FinancialUser)\
                .outerjoin(models.BankAccount, models.FinancialTransaction.bank_account_id == models.BankAccount.id)\
                .outerjoin(models.FinancialInstitution, models.BankAccount.institution_id == models.FinancialInstitution.id)\
                .outerjoin(FinancialUser, models.FinancialTransaction.recorded_by_id == FinancialUser.id)\
                .all()
        
        result = []
        
        # Formatear Incomes (Automáticos)
        for inc, acc, inst, tx_user, pay_user, tx_voucher, pay_voucher in incomes:
            acc_name = "Sin asignar"
            if acc and inst:
                acc_name = f"{acc.alias} [{inst.short_name or inst.name}]"
            
            # Resolve User (Priority: PaymentUser > TransactionUser)
            user = pay_user if pay_user else tx_user
            
            # Resolve Voucher (Priority: V2 Payment Voucher > Legacy Transaction Voucher)
            voucher = pay_voucher if pay_voucher else tx_voucher

            user_name = "Desconocido"
            if user:
                user_name = f"{user.firstName} {user.lastName}".strip() or user.name or user.email
                
            result.append({
                "id": f"inc_{inc.id}",
                "date": inc.created_at.isoformat() if inc.created_at else None,
                "fecha": inc.created_at.isoformat() if inc.created_at else None,
                "description": inc.concept,
                "descripcion": inc.concept,
                "category": inc.category or "Inscripciones",
                "categoria": inc.category or "Inscripciones",
                "amount": float(inc.amount or 0),
                "monto": float(inc.amount or 0),
                "type": "income",
                "account": acc_name,
                "accountId": inc.bank_account_id,
                "cuenta_id": inc.bank_account_id,
                "userName": user_name,
                "usuario": user_name,
                "userId": user.id if user else None,
                "voucher": voucher
            })
            
        # Formatear FinancialTransactions (Manuales)
        for ft, acc, inst, user in financials:
            acc_name = "Sin asignar"
            if acc and inst:
                acc_name = f"{acc.alias} [{inst.short_name or inst.name}]"
                
            user_name = "Tesorería"
            if user:
                user_name = f"{user.firstName} {user.lastName}".strip() or user.name or user.email
                
            result.append({
                "id": f"ft_{ft.id}",
                "date": ft.date.isoformat() if ft.date else None,
                "fecha": ft.date.isoformat() if ft.date else None,
                "description": ft.description,
                "descripcion": ft.description,
                "category": ft.category,
                "categoria": ft.category,
                "amount": float(ft.amount or 0),
                "monto": float(ft.amount or 0),
                "type": ft.type,
                "account": acc_name,
                "accountId": ft.bank_account_id,
                "cuenta_id": ft.bank_account_id,
                "userName": user_name,
                "usuario": user_name,
                "userId": user.id if user else None,
                "voucher": ft.voucher_url
            })
            
        # Ordenar por fecha desc
        result.sort(key=lambda x: x['date'] or '', reverse=True)
        return result
    except Exception as e:
        print(f"Error in get_transactions: {e}")
        import traceback
        traceback.print_exc()
        # Return empty list instead of 500 to allow frontend to load
        return []

# Nuevo: POST para transacciones manuales (Soporta Voucher)
@router.post("/transactions")
def add_transaction(
    descripcion: str = Form(...),
    monto: float = Form(...),
    categoria: str = Form(...),
    cuenta_id: int = Form(...),
    type: str = Form("income"),
    fecha: Optional[str] = Form(None),
    voucher: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Guardar voucher si existe
    voucher_url = None
    if voucher:
        voucher_url = utils.save_voucher_file(voucher, "MANUAL")

    new_ft = models.FinancialTransaction(
        description=descripcion,
        amount=monto,
        category=categoria,
        type=type,
        bank_account_id=cuenta_id,
        voucher_url=voucher_url,
        recorded_by_id=current_user.id,
        date=utils.get_peru_time() if not fecha else datetime.fromisoformat(fecha)
    )
    db.add(new_ft)
    db.commit()
    db.refresh(new_ft)
    return new_ft

# 4. Plan de Contribuciones (Mock para evitar error 404)
@router.get("/contributions/plan")
def get_contribution_plan():
    return [{"category": "General", "amount": 1000}]

# 5. Cuentas (Mock)
@router.get("/accounts")
def get_accounts():
    return [{"id": "acc_001", "bank": "BCP", "number": "193-1234567-0-99"}]

# 6. Multas (Mock)
@router.get("/fines")
def get_fines():
    return []

# 7. Presupuestos (Para evitar 404)
@router.get("/budgets")
def get_budgets():
    return [
        {"category": "Logística", "amount": 5000, "spent": 2000},
        {"category": "Marketing", "amount": 3000, "spent": 500}
    ]

# 8. Pricing Config (Para evitar 404)
@router.get("/pricing")
def get_pricing(db: Session = Depends(get_db)):
    # 1. Fetch Modalities (Ticket Types)
    modalities = db.query(models.RegistrationModality).filter(models.RegistrationModality.is_active == True).all()
    ticket_types = [
        {
            "id": m.code, # Map code to ID for frontend compatibility
            "code": m.code,
            "name": m.title,
            "title": m.title, # Double map for safety
            "price": m.price,
            "description": m.description
        } for m in modalities
    ]

    # 2. Fetch Workshops
    workshops_db = db.query(models.Workshop).filter(models.Workshop.is_active == True).all()
    workshops = [
        {
            "id": w.id,
            "name": w.name,
            "title": w.name, # Workshop model uses name, map to title as well
            "price": w.price,
            "description": w.description
        } for w in workshops_db
    ]

    return {
        "ticketTypes": ticket_types,
        "workshops": workshops
    }

# --- NUEVOS ENDPOINTS DE "SALA DE ESPERA" (STAGING AREA) ---
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Body
from database import get_db
import models
import utils
import oauth2
from oauth2 import get_current_user
from datetime import datetime

# 9. Listar Solicitudes Pendientes (Staging Area)
@router.get("/requests")
def get_pending_requests(
    db: Session = Depends(get_db)
):
    # Traemos las solicitudes simples (Inscripciones)
    results = db.query(models.RegistrationRequest).all()

    formatted_requests = []
    
    # 1. Registration Requests
    for req in results:
        req_dict = {c.name: getattr(req, c.name) for c in req.__table__.columns}
        req_dict['payment_account_interpreted'] = req.payment_account or "No indicada"
        req_dict['type'] = 'registration' # Flag for Frontend
        formatted_requests.append(req_dict)

    # 2. Payment Transactions (Pending Validation - V2)
    # We fetch transactions that are PENDING and have a user associated
    pending_txs = db.query(models.PaymentTransaction)\
        .filter(models.PaymentTransaction.status == models.PaymentStatus.PENDING)\
        .all()

    for tx in pending_txs:
        # Resolve User info manually (assuming user relation exists on tx, mapped to 'user')
        if not tx.user: continue

        # Load real breakdown from relations
        real_breakdown = []
        
        try:
            # 1. Contributions (Meses)
            if tx.contributions:
                for c in tx.contributions:
                    # Robust Month Label
                    month_label = "Mensualidad"
                    try:
                        if c.month_date:
                            # Attempt to format date
                            month_label = c.month_date.strftime("%B")
                        else:
                            month_label = "Mes Desconocido"
                    except:
                        month_label = str(getattr(c, 'month_date', 'Unknown'))

                    real_breakdown.append({
                        "label": f"Aporte {month_label}",
                        "detail": "Mensualidad",
                        "price": float(c.amount or 0)
                    })
            
            # 2. Penalties (Multas)
            if tx.penalties:
                for p in tx.penalties:
                    real_breakdown.append({
                        "label": "Penalidad",
                        "detail": getattr(p, 'concept', None) or getattr(p, 'description', 'Multa'),
                        "price": float(p.amount or 0)
                    })
        except Exception as e:
            print(f"⚠️ Error building breakdown for tx {tx.id}: {e}")
            # Do not crash the whole request, just proceed with partial or empty breakdown

        # Check if breakdown is empty but amount exists (Legacy fallback)
        if not real_breakdown and float(tx.amount) > 0:
            real_breakdown.append({
                "label": "Pago de Penalidad/Aporte",
                "detail": "Acceso al Congreso",
                "price": float(tx.amount)
            })

        # Map to Frontend Schema (mimicking RegistrationRequest structure)
        formatted_requests.append({
            "id": tx.id, # Keep Int ID. Frontend sends this to validateVoucherV2
            "type": "payment", # Flag for Frontend
            
            # User Data
            "dni": tx.user.dni,
            "firstname": tx.user.firstName,
            "lastname": tx.user.lastName,
            "email": tx.user.email,
            "phone": tx.user.phone,
            "occupation": tx.user.occupation or "Organizador/Usuario",
            "specialty": "", # Optional
            "institution": tx.user.institution or "SIMR 2026",
            "university": tx.user.university,
            "residency_year": tx.user.residencyYear,
            "cmp_number": tx.user.cmp_number,

            # Payment Data
            "created_at": tx.payment_date or datetime.utcnow(), # Fixed: PaymentTransaction uses payment_date
            "payment_account": tx.payment_method, 
            "payment_account_interpreted": tx.bank_account.alias if tx.bank_account else (tx.payment_method or "Transferencia"),
            "total_amount": float(tx.amount),
            "voucher_url": tx.voucher_url,
            
            # Metadata for Detail View
            "items_detail": {
                "modality": {"title": "Pago de Penalidad/Aporte", "price": float(tx.amount)},
                "workshops": []
            },
            "breakdown": real_breakdown # <--- KEY FIELD FOR MODAL
        })

    # Sort by date desc
    formatted_requests.sort(key=lambda x: x.get('created_at') or datetime.min, reverse=True)

    return formatted_requests

# RADICAL FIX FOR 72-BYTE ERROR
@router.post("/requests/{req_id}/approve")
def approve_request(
    req_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    print(f"🚀 INICIANDO APROBACIÓN para ID: {req_id}") # LOG 1

    # 1. Buscar Solicitud
    req = db.query(models.RegistrationRequest).filter(models.RegistrationRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    try:
        # 2. Diagnóstico del DNI (Míralo en la consola negra)
        print(f"🔍 DNI Original recibido: {req.dni}")

        # 3. Preparar Snapshot
        snapshot = req.items_detail or {}
        if isinstance(snapshot, str):
            import json
            snapshot = json.loads(snapshot)

        # ==================================================================
        # 🛡️ ZONA DE CORTE (Sanitización Extrema)
        # ==================================================================
        
        # A. Restauramos el DNI como contraseña predeterminada (Requerimiento de Usuario)
        dni_string = str(req.dni) if req.dni else "123456"
        password_source = dni_string[0:15]
        
        print(f"🔐 Password predeterminada basada en DNI: {password_source}")

        # B. HASHEAMOS
        hashed_pw = utils.hash(password_source) 
        
        def clean_int(value):
            if not value: return None
            if isinstance(value, int): return value
            if isinstance(value, str):
                return int(value) if value.isdigit() else None
            return None 

        # 4. Crear Usuario
        new_user = models.User(
            id=f"usr_{req.dni}", # <--- ID OBLIGATORIO
            email=req.email,
            password=hashed_pw, # <--- Usamos el hash seguro
            dni=req.dni,        # Aquí guardamos el DNI original (aunque sea largo, la BD lo aguanta si es Text)
            firstName=req.firstname,
            lastName=req.lastname,
            name=f"{req.firstname} {req.lastname}",
            phone=req.phone,
            occupation=req.occupation,
            university=req.university,
            specialty=req.specialty,
            
            cmp_number=str(req.cmp_number) if req.cmp_number else None,
            rne_number=str(req.rne_number) if req.rne_number else None,
            residencyYear=str(req.residency_year)[:10] if req.residency_year else None,
            
            modality_id=clean_int(snapshot.get('modality', {}).get('id')),
            status='active',
            eventRole='asistente',
            roles=['asistente'], # <--- Iniciamos lista oficial de roles
            modules=["mi_perfil", "aula_virtual", "trabajos", "certificados"], # Default modules
            permissions=[],
            workshops=[ws.get('id') for ws in snapshot.get('workshops', [])] if snapshot.get('workshops') else []
        )
        
        db.add(new_user)
        db.flush()

        # 5. Crear Transacción
        new_tx = models.Transaction(
            user_id=new_user.id,
            status="approved",
            total_amount=req.total_amount,
            voucher_url=req.voucher_url,
            items_snapshot=snapshot,
            approved_by_id=current_user.id,
            approved_at=utils.get_peru_time(), # <--- PERU TIME
            created_at=utils.get_peru_time()    # <--- PERU TIME
        )
        db.add(new_tx)
        db.flush()

        # 6. Ingresos
        # Prioridad 1: La cuenta que el usuario reportó en su registro
        # Prioridad 2: La cuenta configurada por defecto para Inscripciones
        config_dest = db.query(models.FundDestination).filter_by(income_type="Inscripciones").first()
        default_account_id = config_dest.target_account_id if config_dest else None
        
        target_account_id = req.payment_account_id or default_account_id
        
        print(f"💰 REGISTRANDO INGRESO - Cuenta: {target_account_id}")

        mod_data = snapshot.get('modality', {})
        if mod_data and mod_data.get('price', 0) > 0:
            db.add(models.Income(
                transaction_id=new_tx.id,
                bank_account_id=target_account_id,
                concept=f"Inscripción: {mod_data.get('title', 'General')}",
                amount=mod_data.get('price'),
                category="Inscripciones"
            ))
            
        for ws in snapshot.get('workshops', []):
            if ws.get('price', 0) > 0:
                db.add(models.Income(
                    transaction_id=new_tx.id,
                    bank_account_id=target_account_id,
                    concept=f"Taller: {ws.get('title', 'Taller')}",
                    amount=ws.get('price'),
                    category="Talleres"
                ))

        # 7. Finalizar
        db.delete(req)
        db.commit()
        
        print("✅ APROBACIÓN EXITOSA")
        return {"message": "Aprobado correctamente"}

    except Exception as e:
        db.rollback()
        print(f"❌ ERROR CRÍTICO APPROVE: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error Backend: {str(e)}")

@router.post("/requests/{req_id}/reject")
def reject_request(
    req_id: int,
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    req = db.query(models.RegistrationRequest).filter_by(id=req_id).first()
    if not req:
        raise HTTPException(404, "No existe")
        
    # 1. Borrar archivo físico
    if req.voucher_url:
        utils.delete_file_from_disk(req.voucher_url)
        
    # 2. Borrar registro de BD
    db.delete(req)
    db.commit()
    
    return {"message": "Solicitud eliminada. El usuario puede volver a registrarse."}

# 10. Endpoint para el Widget Lateral (Sala de Espera - Últimos 5)
@router.get("/requests/recent")
def get_recent_requests(
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Devuelve las solicitudes más recientes de la Sala de Espera"""
    recent = db.query(models.RegistrationRequest)\
        .order_by(models.RegistrationRequest.created_at.desc())\
        .limit(limit)\
        .all()
    return recent

# 11. Endpoint para el Historial Completo (Transacciones Procesadas)
@router.get("/transactions/history")
def get_transaction_history(
    db: Session = Depends(get_db)
):
    """Devuelve el historial de transacciones (aprobadas/rechazadas) con datos de usuario y cuenta"""
    from sqlalchemy.orm import aliased
    Approver = aliased(models.User)
    
    # Hacemos un JOIN múltiple para traer datos del usuario, approver y la cuenta
    history = db.query(
        models.Transaction, 
        models.User,
        models.BankAccount,
        models.FinancialInstitution,
        Approver
    ).join(
        models.User, models.Transaction.user_id == models.User.id
    ).outerjoin(
        Approver, models.Transaction.approved_by_id == Approver.id
    ).outerjoin(
        models.Income, models.Transaction.id == models.Income.transaction_id
    ).outerjoin(
        models.BankAccount, models.Income.bank_account_id == models.BankAccount.id
    ).outerjoin(
        models.FinancialInstitution, models.BankAccount.institution_id == models.FinancialInstitution.id
    ).order_by(
        models.Transaction.created_at.desc()
    ).all()
    
    # Formateamos la respuesta para el frontend
    result = []
    seen_tx = set()
    
    for tx, user, acc, inst, approver in history:
        if tx.id in seen_tx:
            continue
        seen_tx.add(tx.id)
        
        # Convertimos el objeto SQLAlchemy a dict
        tx_data = {c.name: getattr(tx, c.name) for c in tx.__table__.columns}
        
        # Interpretación de cuenta
        account_name = "No indicada"
        if acc and inst:
            account_name = f"{acc.alias} [{inst.short_name or inst.name}]"
        
        tx_data['payment_account_interpreted'] = account_name
        
        # Auditoría: Quién lo aprobó
        tx_data['approved_by_name'] = f"{approver.firstName} {approver.lastName}" if approver else "Sistema"
        
        # Datos del usuario normalizados para el modal
        tx_data['user'] = {
            'id': user.id,
            'fullname': f"{user.firstName} {user.lastName}",
            'firstName': user.firstName,
            'lastName': user.lastName,
            'email': user.email,
            'dni': user.dni
        }
        # Flat fields para compatibilidad con el Modal common access
        tx_data['firstName'] = user.firstName
        tx_data['lastName'] = user.lastName
        tx_data['firstname'] = user.firstName # Fallback redundancy
        tx_data['lastname'] = user.lastName # Fallback redundancy
        
        result.append(tx_data)
    return result

@router.get("/transactions/recent-approved")
def get_recent_approved_transactions(
    limit: int = 4,
    db: Session = Depends(get_db),
    # current_user: models.User = Depends(get_current_user)
):
    try:
        from sqlalchemy.orm import aliased
        Approver = aliased(models.User)

        # 1. Obtener transacciones aprobadas con datos de usuario y cuenta (vía Income)
        results = db.query(
            models.Transaction, 
            models.User,
            models.BankAccount,
            models.FinancialInstitution,
            Approver
        ).join(
            models.User, models.Transaction.user_id == models.User.id
        ).outerjoin(
            Approver, models.Transaction.approved_by_id == Approver.id
        ).outerjoin(
            models.Income, models.Transaction.id == models.Income.transaction_id
        ).outerjoin(
            models.BankAccount, models.Income.bank_account_id == models.BankAccount.id
        ).outerjoin(
            models.FinancialInstitution, models.BankAccount.institution_id == models.FinancialInstitution.id
        ).filter(
            models.Transaction.status == "approved"
        ).order_by(
            models.Transaction.approved_at.desc()
        ).limit(limit).all()

        clean_results = []
        # Usamos un set para evitar duplicados si una transacción tiene múltiples ingresos
        seen_tx = set()

        for tx, user, acc, inst, approver in results:
            if tx.id in seen_tx:
                continue
            seen_tx.add(tx.id)

            # Aseguramos que created_at no sea None para evitar "Invalid Date"
            display_date = tx.approved_at or tx.created_at or utils.get_peru_time()

            account_name = "No indicada"
            if acc and inst:
                account_name = f"{acc.alias} [{inst.short_name or inst.name}]"

            item = {
                "id": tx.id,
                "total_amount": tx.total_amount,
                "approved_at": tx.approved_at.isoformat() if tx.approved_at else None,
                "created_at": display_date.isoformat() if hasattr(display_date, 'isoformat') else str(display_date),
                "voucher_url": tx.voucher_url,
                "items_detail": tx.items_snapshot, 
                "payment_account_interpreted": account_name,
                "approved_by_name": f"{approver.firstName} {approver.lastName}" if approver else "Sistema",
                # Datos del Usuario - CAMELCASE para match con frontend Widget
                "firstName": user.firstName or "",
                "lastName": user.lastName or "",
                "email": user.email,
                "dni": user.dni
            }
            clean_results.append(item)

        return clean_results

    except Exception as e:
        print(f"❌ ERROR EN RECENT-APPROVED: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
