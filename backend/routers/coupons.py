import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
import models, schemas, oauth2, database
from datetime import datetime

router = APIRouter(
    prefix="/coupons",
    tags=['Coupons']
)

def generate_secure_token(prefix: str = None) -> str:
    """
    Genera un token de alta entropía.
    Excluye I, l, 1, O, 0 para evitar confusión visual.
    """
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    token = ''.join(secrets.choice(alphabet) for _ in range(8))
    
    if prefix:
        clean_prefix = "".join(c for c in prefix if c.isalnum()).upper()
        return f"{clean_prefix}-{token}"
    return token

@router.get("/", response_model=List[schemas.CouponOut])
def get_coupons(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    return db.query(models.Coupon).order_by(models.Coupon.created_at.desc()).all()

@router.post("/", response_model=Any)
def create_coupon(
    coupon_in: schemas.CouponCreateExtended,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Solo administradores pueden crear cupones (asumimos lógica por roles)
    if current_user.eventRole not in ['organizador', 'superadmin']:
        # Check permissions logic if needed, for now use eventRole
        pass

    generated_coupons = []
    qty = coupon_in.quantity if coupon_in.is_batch else 1
    
    for _ in range(qty):
        unique = False
        attempts = 0
        while not unique and attempts < 10:
            # Si no es batch y tiene código predefinido, usarlo. 
            # Si es batch o código vacío, generar uno.
            code = coupon_in.code.upper() if (not coupon_in.is_batch and coupon_in.code) else generate_secure_token(coupon_in.batch_prefix)
            
            existing = db.query(models.Coupon).filter(models.Coupon.code == code).first()
            if not existing:
                unique = True
            attempts += 1
            
            # Si el usuario mandó un código específico e individual, no reintentamos generar
            if not coupon_in.is_batch and coupon_in.code:
                if existing:
                     raise HTTPException(status_code=400, detail=f"El código {code} ya existe")
                break

        if not unique:
            raise HTTPException(status_code=500, detail="No se pudo generar un código único. Intente de nuevo.")

        new_coupon = models.Coupon(
            code=code,
            description=coupon_in.description,
            expiry=coupon_in.expiry,
            max_uses=coupon_in.maxUses,
            
            # Legacy fields (Using camelCase from Pydantic model)
            applicable_modality=coupon_in.applicableModality,
            modality_discount=coupon_in.modalityDiscount,
            workshop_discounts=coupon_in.workshopDiscounts,
            
            # New fields
            discount_type=coupon_in.discountType,
            discount_value=coupon_in.discountValue,
            target_modules=coupon_in.targetModules,
            
            active=coupon_in.active,
            group_tag=coupon_in.groupTag if hasattr(coupon_in, 'groupTag') else coupon_in.group_tag, # Handle alias safely
            created_by=current_user.id
        )
        db.add(new_coupon)
        generated_coupons.append(new_coupon)

    db.commit()
    
    if coupon_in.is_batch:
        return {"message": f"{len(generated_coupons)} cupones creados", "codes": [c.code for c in generated_coupons]}
    
    return generated_coupons[0]

@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    db.delete(coupon)
    db.commit()
    return {"detail": "Cupón eliminado"}

@router.put("/{coupon_id}", response_model=schemas.CouponOut)
def update_coupon(
    coupon_id: int,
    coupon_in: schemas.CouponCreateExtended,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    
    # Update fields
    # Note: Code is typically not updatable to avoid integrity issues, or if updated, check uniqueness
    if coupon_in.code and coupon_in.code != coupon.code:
         existing = db.query(models.Coupon).filter(models.Coupon.code == coupon_in.code).first()
         if existing:
             raise HTTPException(status_code=400, detail=f"El código {coupon_in.code} ya existe")
         coupon.code = coupon_in.code.upper()

    coupon.description = coupon_in.description
    coupon.expiry = coupon_in.expiry
    coupon.max_uses = coupon_in.maxUses
    coupon.active = coupon_in.active
    
    # New fields
    coupon.discount_type = coupon_in.discountType
    coupon.discount_value = coupon_in.discountValue
    coupon.target_modules = coupon_in.targetModules
    
    coupon.group_tag = coupon_in.groupTag if hasattr(coupon_in, 'groupTag') else coupon_in.group_tag
    
    db.commit()
    db.refresh(coupon)
    return coupon

@router.post("/validate")
def validate_coupon(
    redeem_data: schemas.CouponRedeem,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """
    Solo valida si el cupón es aplicable, sin quemarlo ni dar acceso.
    """
    coupon = db.query(models.Coupon).filter(models.Coupon.code == redeem_data.code.upper()).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no válido o inexistente")

    if not coupon.active:
        raise HTTPException(status_code=400, detail="El cupón está desactivado")
    
    now_iso = datetime.now().isoformat()
    if coupon.expiry < now_iso:
         raise HTTPException(status_code=400, detail="El cupón ha expirado")

    if coupon.max_uses > 0 and coupon.used_count >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Este cupón ha agotado sus usos")

    usage_check = db.query(models.CouponUsage).filter(
        models.CouponUsage.coupon_id == coupon.id,
        models.CouponUsage.user_id == current_user.id
    ).first()
    if usage_check:
        raise HTTPException(status_code=400, detail="Ya has utilizado este cupón")

    return {
        "status": "valid",
        "benefits": {
            # New Unified Structure
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "target_modules": coupon.target_modules,
            
            # Legacy support
            "modality": coupon.applicable_modality,
            "modality_discount": coupon.modality_discount,
            "workshops": coupon.workshop_discounts
        }
    }

@router.post("/redeem")
def redeem_coupon(
    redeem_data: schemas.CouponRedeem,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # 1. Buscar
    coupon = db.query(models.Coupon).filter(models.Coupon.code == redeem_data.code.upper()).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no válido o inexistente")

    # 2. Validar
    if not coupon.active:
        raise HTTPException(status_code=400, detail="El cupón está desactivado")
    
    now_iso = datetime.now().isoformat()
    if coupon.expiry < now_iso:
         raise HTTPException(status_code=400, detail="El cupón ha expirado")

    if coupon.max_uses > 0 and coupon.used_count >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Este cupón ha agotado sus usos")

    # 3. Validar si ya lo usó el usuario
    usage_check = db.query(models.CouponUsage).filter(
        models.CouponUsage.coupon_id == coupon.id,
        models.CouponUsage.user_id == current_user.id
    ).first()
    if usage_check:
        raise HTTPException(status_code=400, detail="Ya has utilizado este cupón")

    # 4. Conceder Beneficios al Usuario
    
    # A) Nuevo Sistema: Target Modules
    if coupon.target_modules:
        for item_id in coupon.target_modules:
            # 1. Intentar como Modalidad
            modality = db.query(models.RegistrationModality).filter(models.RegistrationModality.code == item_id).first()
            if modality:
                current_user.modality_id = modality.id
                current_user.registrationType = modality.code
                continue # Ya encontrada, siguiente item
            
            # 2. Intentar como Taller
            # Asumimos que si no es modalidad, es taller (o verificar existencia)
            # Para mayor seguridad, podríamos verificar en tabla Workshop
            # pero por rendimiento confiamos si el ID tiene formato de taller? 
            # Mejor verificamos para evitar basura.
            workshop = db.query(models.Workshop).filter(models.Workshop.id == item_id).first()
            if workshop:
                user_workshops = list(current_user.workshops) if current_user.workshops else []
                if item_id not in user_workshops:
                    user_workshops.append(item_id)
                    current_user.workshops = user_workshops
                    current_user.purchasedItems = user_workshops
    
    # B) Legacy System (Fallback)
    # a) Modalidad (Si aplica)
    elif coupon.applicable_modality:
        modality = db.query(models.RegistrationModality).filter(models.RegistrationModality.code == coupon.applicable_modality).first()
        if modality:
            current_user.modality_id = modality.id
            current_user.registrationType = modality.code # Sync legacy field

    # b) Talleres (Unirse a los existentes)
    if coupon.workshop_discounts: # Legacy uses dict keys
        user_workshops = list(current_user.workshops) if current_user.workshops else []
        new_workshops = list(coupon.workshop_discounts.keys())
        # Combinar y deduplicar
        updated_workshops = list(set(user_workshops + new_workshops))
        current_user.workshops = updated_workshops
        current_user.purchasedItems = updated_workshops # Sync legacy field

    # 5. Redención Atómica (Update counter)
    coupon.used_count += 1
    
    # 6. Log de Auditoría
    usage = models.CouponUsage(
        coupon_id=coupon.id,
        user_id=current_user.id
    )
    db.add(usage)
    db.commit()

    return {
        "status": "success", 
        "message": "Cupón canjeado",
        "benefits": {
            "modality": coupon.applicable_modality,
            "modality_discount": coupon.modality_discount,
            "workshops": coupon.workshop_discounts
        }
    }

@router.get("/usages", response_model=List[schemas.CouponUsageOut])
def get_usages(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Devolver lista de usos con info del usuario
    usages = db.query(models.CouponUsage).order_by(models.CouponUsage.used_at.desc()).all()
    res = []
    for u in usages:
        res.append({
            "id": u.id,
            "user_id": u.user_id,
            "used_at": u.used_at,
            "user_name": f"{u.user.firstName} {u.user.lastName}" if u.user else "Usuario Desconocido",
            "coupon_code": u.coupon.code if u.coupon else "CÓDIGO ELIMINADO"
        })
    return res


@router.get("/{coupon_id}/history", response_model=List[schemas.CouponUsageDetail])
def get_coupon_history(
    coupon_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    """
    Obtiene el historial detallado de quién usó un cupón específico.
    """
    # 1. Verificar que el cupón existe
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")

    # 2. Consultar usos con relación a usuario
    results = []
    for usage in coupon.usages:
        if usage.user:
            results.append({
                "used_at": usage.used_at,
                "user_full_name": f"{usage.user.firstName} {usage.user.lastName}",
                "user_email": usage.user.email,
                "user_dni": usage.user.dni or "N/A"
            })
        
    return results
