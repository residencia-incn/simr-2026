from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
from datetime import timedelta
import auth
import oauth2

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint de autenticación REAL con JWT.
    """
    # 1. Buscar al usuario
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    # 2. Verificar existencia y contraseña
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not auth.verify_password(credentials.password, user.password or ""):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # 3. Generar token
    access_token = auth.create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=60*24) # 24 horas
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name or f"{user.firstName} {user.lastName}",
            "role": user.eventRole or "asistente",
            "modules": user.modules or []
        }
    }

# ESQUEMAS
from schemas import UserIdentityCheck

@router.post("/validate-identity")
def check_user_availability(
    data: UserIdentityCheck, 
    db: Session = Depends(get_db)
):
    """
    Verifica si los identificadores únicos ya existen antes de avanzar el registro.
    """
    
    try:
        # 1. Validar Email
        if db.query(models.User).filter(models.User.email == data.email).first():
            raise HTTPException(status_code=409, detail="Este correo electrónico ya está registrado.")
        if db.query(models.RegistrationRequest).filter(models.RegistrationRequest.email == data.email).first():
            raise HTTPException(status_code=409, detail="Este correo electrónico tiene una solicitud pendiente.")

        # 2. Validar DNI
        if db.query(models.User).filter(models.User.dni == data.dni).first():
            raise HTTPException(status_code=409, detail=f"El DNI {data.dni} ya se encuentra registrado.")
        if db.query(models.RegistrationRequest).filter(models.RegistrationRequest.dni == data.dni).first():
            raise HTTPException(status_code=409, detail=f"El DNI {data.dni} tiene una solicitud pendiente.")

        # 3. Validar CMP (Solo si se envía)
        if data.cmp_number:
            cmp_clean = data.cmp_number.strip()
            if db.query(models.User).filter(models.User.cmp_number == cmp_clean).first():
                raise HTTPException(status_code=409, detail=f"El CMP {cmp_clean} ya está en uso.")
            if db.query(models.RegistrationRequest).filter(models.RegistrationRequest.cmp_number == cmp_clean).first():
                raise HTTPException(status_code=409, detail=f"El CMP {cmp_clean} tiene una solicitud pendiente.")

        # 4. Validar RNE (Solo si se envía)
        if data.rne_number:
            rne_clean = data.rne_number.strip()
            if db.query(models.User).filter(models.User.rne_number == rne_clean).first():
                raise HTTPException(status_code=409, detail=f"El RNE {rne_clean} ya está registrado.")
            if db.query(models.RegistrationRequest).filter(models.RegistrationRequest.rne_number == rne_clean).first():
                raise HTTPException(status_code=409, detail=f"El RNE {rne_clean} tiene una solicitud pendiente.")

        # Si pasa todo, retornamos luz verde 🟢
        return {"status": "available", "message": "Datos disponibles"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno validando identidad: {str(e)}")

from schemas import UserCreate, User
# pwd_context removed

@router.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Recuperar la configuración del sistema para ver las reglas
    config = db.query(models.SystemConfig).first()
    
    # Asegurar que occupations sea una lista válida
    occupations = config.allowed_occupations if config and config.allowed_occupations else []
    
    # Normalizar nombre de ocupación
    user_occ = user.occupation
    
    # Buscar la regla para la ocupación que envía el usuario
    # Manejar tanto strings antiguos como objetos nuevos
    selected_rule = None
    for occ in occupations:
        if isinstance(occ, dict) and occ.get('name') == user_occ:
            selected_rule = occ
            break
        elif isinstance(occ, str) and occ == user_occ:
            # Si es string, aplicar reglas por defecto (hardcodeadas backend por seguridad si no hay config explícita)
            # O mejor, si es string y no hay objeto de reglas, asumir que no tiene reglas especiales
            # PERO para retrocompatibilidad con la lógica frontend:
            pass # No rules object attached to string

    if selected_rule and 'rules' in selected_rule:
        rules = selected_rule['rules']
        
        # Validación CMP
        if rules.get('cmp') and not user.cmp_number:
             raise HTTPException(status_code=400, detail="El número de CMP es obligatorio para su ocupación.")
             
        # Validación RNE
        if rules.get('rne') and not user.rne_number:
             raise HTTPException(status_code=400, detail="El RNE es obligatorio para especialistas.")
             
        # Validación Universidad
        if rules.get('university') and not user.university:
             raise HTTPException(status_code=400, detail="Debe indicar su universidad.")
             
        # Validación Año Residencia
        if rules.get('year') and not user.residencyYear: # residencyYear not in UserCreate yet? Check field name
             # Schema fields match? UserCreate has residencyYear?
             pass 

    # 2. Verificar duplicados de nuevo (Safety net)
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado.")
        
    # 3. Crear Usuario
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        id=f"usr_{user.dni}" if user.dni else f"usr_{user.email}",
        email=user.email, 
        password=hashed_password,
        name=user.name or f"{user.firstName} {user.lastName}",
        firstName=user.firstName,
        lastName=user.lastName,
        dni=user.dni,
        occupation=user.occupation,
        phone=user.phone, # Check UserCreate schema for phone
        institution=user.institution,
        university=user.university,
        cmp_number=user.cmp_number,
        rne_number=user.rne_number,
        specialty=user.specialty,
        # Default role
        eventRole="asistente"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

import json
from typing import Optional
from fastapi import File, UploadFile, Form
import utils

@router.post("/register-request")
def register_request(
    registration_data: str = Form(...), 
    voucher_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # 1. Parsear datos
    try:
        payload = json.loads(registration_data)
        pd = payload['personal_data']
        payment = payload['payment_info']
        items = payload['items_detail']
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Datos corruptos o estructura inválida: {str(e)}")

    # 2. Validaciones de Triaje (DNI/Email)
    # Verificamos si ya es USUARIO OFICIAL
    if db.query(models.User).filter(models.User.dni == pd['dni']).first():
        raise HTTPException(status_code=409, detail="Este DNI ya es miembro oficial. Por favor inicie sesión.")
    
    # Verificamos si ya tiene SOLICITUD PENDIENTE
    if db.query(models.RegistrationRequest).filter(models.RegistrationRequest.dni == pd['dni']).first():
        raise HTTPException(status_code=400, detail="Ya tienes una solicitud en revisión. Espera a la confirmación.")

    # 3. Guardar Voucher
    voucher_url = utils.save_voucher_file(voucher_file, pd['dni']) if voucher_file else None

    # 4. CREAR SOLICITUD EN SALA DE ESPERA
    req = models.RegistrationRequest(
        dni=pd['dni'],
        email=pd['email'],
        firstname=pd['firstname'],
        lastname=pd['lastname'],
        phone=pd.get('phone'),
        occupation=pd.get('occupation'),
        cmp_number=pd.get('cmp_number'),
        rne_number=pd.get('rne_number'),
        university=pd.get('university'),
        residency_year=pd.get('residency_year'),
        specialty=pd.get('specialty'),
        
        total_amount=payment.get('total_amount'),
        payment_account=payment.get('payment_account'),
        payment_account_id=payment.get('payment_account_id'), # NEW FIELD
        coupon_code_used=payment.get('coupon_code'),
        voucher_url=voucher_url,
        items_detail=items, # Guardamos el JSON completo
        created_at=utils.get_peru_time() # <--- PERU TIME
    )
    
    db.add(req)
    db.commit()
    
    return {"message": "Solicitud enviada a Tesorería"}
