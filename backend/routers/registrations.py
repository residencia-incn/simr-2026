from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, auth, database
from datetime import datetime

router = APIRouter(
    prefix="/registrations",
    tags=['Registrations']
)

@router.post("/", response_model=schemas.TransactionOut)
def register_enrollment(
    registration: dict, # Receiving as dict for flexibility with the current frontend payload
    db: Session = Depends(database.get_db)
):
    # 1. Create or Find User
    email = registration.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Create minimal user
        user = models.User(
            id=f"u-{int(datetime.now().timestamp())}",
            email=email,
            password=auth.get_password_hash("123456"), # Default password
            name=registration.get("name"),
            firstName=registration.get("firstName"),
            lastName=registration.get("lastName"),
            dni=registration.get("dni"),
            phone=registration.get("phone"),
            occupation=registration.get("occupation"),
            specialty=registration.get("specialty"),
            institution=registration.get("institution"),
            status="PENDIENTE"
        )
        db.add(user)
        db.flush() # Get user id

    # 2. Create Transaction
    # items_snapshot format: {"modality_id": "...", "workshop_ids": [...]}
    modality_id = registration.get("ticketType")
    workshop_ids = registration.get("workshops", [])
    
    # Standardize modality_id to integer if it's a numeric string starting with t_?
    # Actually models.py says modality_id is Integer.
    # In my seed, I used codes like "t_presencial_full". 
    # WAIT! If modality_id is Integer in models.py, I should map these codes to IDs.
    
    target_modality = db.query(models.RegistrationModality).filter(models.RegistrationModality.code == modality_id).first()
    
    items_snapshot = {
        "modality_id": target_modality.id if target_modality else None,
        "workshop_ids": workshop_ids, # Keep as is or map strings w_... to something?
        "modality_code": modality_id
    }

    new_tx = models.Transaction(
        user_id=user.id,
        total_amount=registration.get("amount", 0),
        status="pending",
        voucher_url=registration.get("voucherData"), # Base64 for now
        coupon_code_used=registration.get("coupon"),
        items_snapshot=items_snapshot
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    
    return new_tx

@router.get("/check-duplicates")
def check_duplicates(
    dni: Optional[str] = None, 
    email: Optional[str] = None, 
    cmp: Optional[str] = None,
    rne: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    if dni:
        existing = db.query(models.User).filter(models.User.dni == dni).first()
        if existing:
            return {"isDuplicate": True, "field": "dni", "message": f"El DNI {dni} ya está registrado."}
    
    if email:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            return {"isDuplicate": True, "field": "email", "message": f"El correo {email} ya está registrado."}
            
    if cmp:
        existing = db.query(models.User).filter(models.User.cmp_number == cmp).first()
        if existing:
             return {"isDuplicate": True, "field": "cmp", "message": f"El CMP {cmp} ya está registrado."}

    if rne:
        existing = db.query(models.User).filter(models.User.rne_number == rne).first()
        if existing:
             return {"isDuplicate": True, "field": "rne", "message": f"El RNE {rne} ya está registrado."}

    return {"isDuplicate": False}

@router.get("/payment-accounts", response_model=List[schemas.BankAccountOut])
def get_payment_accounts(db: Session = Depends(database.get_db)):
    """
    Retorna las cuentas bancarias habilitadas para inscripción (Configuración de Tesorería).
    """
    import json
    setting = db.query(models.SystemSetting).filter_by(key="inscription_accounts").first()
    
    if not setting or not setting.value:
        return []
        
    try:
        account_ids = json.loads(setting.value)
        if not isinstance(account_ids, list):
            return []
            
        accounts = db.query(models.BankAccount)\
            .filter(models.BankAccount.id.in_(account_ids))\
            .filter(models.BankAccount.is_active == True)\
            .all()
            
        return accounts
    except:
        return []
