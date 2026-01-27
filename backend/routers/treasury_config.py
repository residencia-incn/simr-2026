from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Dict
import shutil
import os
import uuid

from database import get_db
import models
import schemas
import oauth2

router = APIRouter(
    prefix="/treasury/config",
    tags=["Treasury Configuration"],
    # 🔒 Todo este módulo requiere ser Admin o Tesorero
    # dependencies=[Depends(oauth2.get_current_user)] 
)

# ==========================
# 1. VARIABLES GLOBALES (Aportes)
# ==========================
@router.get("/settings", response_model=Dict[str, str])
def get_settings(db: Session = Depends(get_db)):
    """Obtiene todas las variables de configuración como un diccionario"""
    settings = db.query(models.SystemSetting).all()
    # Si esta vacio, podemos devolver defaults o vacio
    return {s.key: s.value for s in settings}

import json

@router.put("/settings")
def update_settings(data: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    """Actualiza múltiples variables a la vez"""
    for key, value in data.settings.items():
        setting = db.query(models.SystemSetting).filter_by(key=key).first()
        
        # Serialize complex types
        if isinstance(value, (list, dict)):
            val_str = json.dumps(value)
        else:
            val_str = str(value)

        if setting:
            setting.value = val_str
        else:
            # Si no existe la variable, la creamos (útil para la primera vez)
            new_setting = models.SystemSetting(key=key, value=val_str)
            db.add(new_setting)
    db.commit()
    return {"message": "Configuración actualizada"}

# ==========================
# 2. INSTITUCIONES Y CUENTAS
# ==========================
@router.get("/institutions", response_model=List[schemas.FinancialInstitutionOut])
def get_institutions(db: Session = Depends(get_db)):
    """Lista bancos y billeteras disponibles (para el select del modal)"""
    institutions = db.query(models.FinancialInstitution).filter_by(is_active=True).all()
    
    # Auto-seed if empty (Optional helper for development)
    if not institutions:
        seed_institutions = [
            {"name": "Banco de Crédito del Perú", "short_name": "BCP", "type": "bank", "logo_url": ""},
            {"name": "Interbank", "short_name": "Interbank", "type": "bank", "logo_url": ""},
            {"name": "BBVA Continental", "short_name": "BBVA", "type": "bank", "logo_url": ""},
            {"name": "Scotiabank Perú", "short_name": "Scotiabank", "type": "bank", "logo_url": ""},
            {"name": "Yape", "short_name": "Yape", "type": "wallet", "logo_url": ""},
            {"name": "Plin", "short_name": "Plin", "type": "wallet", "logo_url": ""},
        ]
        created = []
        for seed in seed_institutions:
            new_inst = models.FinancialInstitution(**seed)
            db.add(new_inst)
            created.append(new_inst)
        db.commit()
        for c in created: db.refresh(c)
        return created

    return institutions

@router.post("/institutions", response_model=schemas.FinancialInstitutionOut)
def create_institution(inst: schemas.FinancialInstitutionCreate, db: Session = Depends(get_db)):
    """Crea una nueva institución financiera"""
    # Verificar duplicados por nombre
    existing = db.query(models.FinancialInstitution).filter(models.FinancialInstitution.name == inst.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una institución con este nombre")
    
    new_inst = models.FinancialInstitution(**inst.dict())
    db.add(new_inst)
    db.commit()
    db.refresh(new_inst)
    return new_inst

@router.put("/institutions/{inst_id}", response_model=schemas.FinancialInstitutionOut)
def update_institution(inst_id: int, inst_data: schemas.FinancialInstitutionUpdate, db: Session = Depends(get_db)):
    """Actualiza una institución"""
    inst = db.query(models.FinancialInstitution).filter(models.FinancialInstitution.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada")
    
    for key, value in inst_data.dict().items():
        setattr(inst, key, value)
    
    db.commit()
    db.refresh(inst)
    return inst

@router.delete("/institutions/{inst_id}")
def delete_institution(inst_id: int, db: Session = Depends(get_db)):
    """Soft delete de una institución"""
    inst = db.query(models.FinancialInstitution).filter(models.FinancialInstitution.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada")
    
    inst.is_active = False
    db.commit()
    return {"message": "Institución eliminada"}

@router.post("/institutions/upload-logo")
async def upload_institution_logo(file: UploadFile = File(...)):
    """Sube un logo y devuelve la URL pública"""
    try:
        # Validar extensión
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.svg', '.webp')):
            raise HTTPException(status_code=400, detail="Formato de archivo no permitido")
        
        # Crear directorio si no existe
        upload_dir = os.path.join("archivo", "logos")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generar nombre único
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Guardar archivo
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Construir URL (Apunta a la carpeta centralizada archivo/)
        # TODO: En producción esto debería ser un bucket S3
        return {"url": f"http://localhost:8000/archivo/logos/{unique_filename}"}
        
    except Exception as e:
        print(f"Error uploading logo: {e}")
        raise HTTPException(status_code=500, detail="Error al subir la imagen")

@router.get("/accounts", response_model=List[schemas.BankAccountOut])
def get_accounts(db: Session = Depends(get_db)):
    """Lista las cuentas internas creadas con sus saldos calculados"""
    accounts = db.query(models.BankAccount).filter_by(is_active=True).all()
    
    for acc in accounts:
        # 1. Sumar Ingresos de Inscripciones/Aportes (Tabla incomes)
        total_incomes = db.query(func.sum(models.Income.amount))\
            .filter(models.Income.bank_account_id == acc.id).scalar() or 0.0
        
        # 2. Sumar/Restar Transacciones Manuales (Tabla financial_transactions)
        total_financials = db.query(
            func.sum(
                case(
                    (models.FinancialTransaction.type == 'income', models.FinancialTransaction.amount),
                    (models.FinancialTransaction.type == 'expense', -models.FinancialTransaction.amount),
                    else_=0
                )
            )
        ).filter(models.FinancialTransaction.bank_account_id == acc.id).scalar() or 0.0
        
        # 3. Asignar saldo calculado al objeto (se usará en el schema BankAccountOut)
        acc.balance = float(total_incomes) + float(total_financials)
        
    return accounts

@router.post("/accounts", response_model=schemas.BankAccountOut)
def create_account(account: schemas.BankAccountCreate, db: Session = Depends(get_db)):
    """Crea una nueva cuenta interna (Desde el Modal)"""
    new_account = models.BankAccount(**account.dict())
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@router.put("/accounts/{account_id}", response_model=schemas.BankAccountOut)
def update_account(account_id: int, account_data: schemas.BankAccountUpdate, db: Session = Depends(get_db)):
    """Actualiza una cuenta existente"""
    account = db.query(models.BankAccount).filter_by(id=account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    for key, value in account_data.dict(exclude_unset=True).items():
        setattr(account, key, value)
    
    db.commit()
    db.refresh(account)
    return account

@router.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    """Soft delete de una cuenta"""
    account = db.query(models.BankAccount).filter_by(id=account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    account.is_active = False
    db.commit()
    return {"message": "Cuenta eliminada"}

# ==========================
# 3. DESTINO DE FONDOS
# ==========================
@router.get("/destinations")
def get_destinations(db: Session = Depends(get_db)):
    """Obtiene el mapa actual de destinos"""
    dests = db.query(models.FundDestination).all()
    # Devolvemos un formato fácil para el frontend: { 'tipo_ingreso': cuenta_id }
    return {d.income_type: d.target_account_id for d in dests}

@router.put("/destinations")
def update_destinations(data: schemas.DestinationUpdateBatch, db: Session = Depends(get_db)):
    """Actualiza hacia dónde va el dinero de cada concepto"""
    for item in data.destinations:
        dest = db.query(models.FundDestination).filter_by(income_type=item.income_type).first()
        if dest:
            dest.target_account_id = item.target_account_id
        else:
            # Si es un tipo de ingreso nuevo, lo creamos
            new_dest = models.FundDestination(income_type=item.income_type, target_account_id=item.target_account_id)
            db.add(new_dest)
    db.commit()
    return {"message": "Destinos de fondos actualizados"}

# ==========================
# 4. CATEGORÍAS DE TRANSACCIÓN
# ==========================
@router.get("/categories", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    """
    Obtiene todas las categorías activas.
    También verificamos si faltan las del sistema y las creamos al vuelo.
    """
    # 1. Auto-healing: Asegurar categorías del sistema
    system_incomes = ["Inscripciones", "Aporte Mensual", "Penalidades", "Talleres"]
    for name in system_incomes:
        exists = db.query(models.TransactionCategory).filter_by(name=name, type='income', is_system=True).first()
        if not exists:
            # Re-activate if it was soft-deleted by mistake manually? 
            # System categories shouldn't be deleted, but let's check basic existence.
            db.add(models.TransactionCategory(name=name, type='income', is_system=True))
    db.commit()

    # 2. Retornar lista completa
    return db.query(models.TransactionCategory).filter_by(is_active=True).all()

@router.post("/categories", response_model=schemas.CategoryOut)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    """Crea una categoría personalizada (is_system=False por defecto)"""
    new_cat = models.TransactionCategory(
        name=category.name,
        type=category.type,
        is_system=False # Siempre falsa si la crea un usuario
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    """Elimina una categoría (Solo si NO es del sistema)"""
    cat = db.query(models.TransactionCategory).filter_by(id=cat_id).first()
    
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # 🔒 PROTECCIÓN DEL SISTEMA
    if cat.is_system:
        raise HTTPException(status_code=400, detail="No puedes eliminar una categoría protegida del sistema.")
        
    cat.is_active = False # Borrado lógico
    db.commit()
    return {"message": "Categoría eliminada"}
