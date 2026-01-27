from fastapi import APIRouter, HTTPException, Depends, Body, status
from typing import List, Optional, Any
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, text
from database import get_db
import models
import utils
import oauth2
from dependencies import require_module
from datetime import date, datetime

router = APIRouter()

# --- INPUT SCHEMAS ---

class UserUpdatePermissions(BaseModel):
    # Para el botón de "Gestión de Módulos"
    modules: List[str]      # Ej: ["organizacion", "academico"]
    permissions: List[str]  # Ej: ["ver_usuarios", "editar_usuarios"]
    eventRoles: Optional[List[str]] = None # También permitimos actualizar roles aquí

class UserAccessUpdate(BaseModel):
    # Nivel 3.1: Payload unificado para "Gestión de Acceso"
    roles: List[str]       # Ej: ["organizador"]
    modules: List[str]     # La lista FINAL de módulos permitidos

class UserResetPassword(BaseModel):
    # Para el botón de "Resetear Contraseña" (Código Rojo)
    password: Optional[str] = Field(None, min_length=6)

# --- OUTPUT SCHEMAS ---

class AuditLogSchema(BaseModel):
    timestamp: datetime
    action: str
    admin_name: Optional[str] = "Sistema" 
    details: Optional[Any] = None

    class Config:
        from_attributes = True

class AbstractStatusSchema(BaseModel):
    id: str
    title: str
    status: str 

class UserBase(BaseModel):
    email: EmailStr
    dni: Optional[str] = None
    name: Optional[str] = None       
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    eventRole: Optional[str] = "participante"   
    isActive: bool = True

class UserListResponse(UserBase):
    id: str
    organizerFunction: Optional[str] = None
    hasPaid: bool
    created_at: Optional[Any] = None 
    registrationDate: Optional[Any] = None
    modalityName: Optional[str] = "Presencial"
    
    # Extras para tabla
    specialty: Optional[str] = None
    occupation: Optional[str] = None
    phone: Optional[str] = None
    
    # Compatibility
    roles: List[str] = []
    eventRoles: List[str] = []

    class Config:
        from_attributes = True

class UserDetailResponse(UserListResponse):
    birthDate: Optional[Any] = None
    institution: Optional[str] = None
    residencyYear: Optional[str] = None
    cmp_number: Optional[str] = None
    rne_number: Optional[str] = None
    
    # CAMPOS CRÍTICOS PARA TU VISTA DE DETALLE
    participationModality: str = "Presencial"  
    inscribedWorkshops: List[str] = []         
    badgeName: Optional[str] = None 
    
    # Académico
    participationType: str = 'Asistente'
    submittedAbstracts: List[AbstractStatusSchema] = []
    certificateGenerated: bool = False
    
    # Seguridad y Accesos
    modules: List[str] = []
    permissions: List[str] = []
    lastLogin: Optional[str] = None
    
    # Auditoría
    auditLog: List[AuditLogSchema] = [] # "auditLog" matches frontend expectation
    
    # Ticket
    ticketType: Optional[str] = "presencial"
    workshops: Optional[List[Any]] = [] 
    
    # Nivel 3.1: Roles Múltiples
    roles: List[str] = []

# --- HELPER FUNCTIONS ---

def create_audit_log(db: Session, target_id: str, admin_id: str, action: str, details: dict = None):
    log = models.AuditLog(
        target_user_id=target_id,
        admin_user_id=admin_id, # En producción, usa el ID del usuario logueado
        action=action,
        details=details or {}
    )
    db.add(log)
    # No hacemos commit aquí para agruparlo con la transacción principal

# --- ENDPOINTS ---

# 1. LISTAR USUARIOS (TABLA)
@router.get("/", response_model=List[UserListResponse], dependencies=[Depends(require_module("organizacion"))])
def get_users(role: Optional[str] = None, q: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Lista usuarios activos.
    - role: Filtra por Rol (ej: 'ponente', 'comite') busca en eventRole y roles list.
    - q: Filtro de búsqueda general (nombre, email, dni).
    """
    # [OPTIMIZACIÓN] joinedload para traer la modalidad en una sola query
    query = db.query(models.User).options(
        joinedload(models.User.registration_modality)
    ).filter(models.User.status != "deleted")
    
    # 1. Filtro por Rol
    if role and role != 'all':
        filter_expression = text(f"roles @> '[\"{role}\"]'")
        query = query.filter(
            (models.User.eventRole == role) | 
            (filter_expression)
        )
        
    # 2. Filtro de Búsqueda
    if q:
        search = f"%{q}%"
        query = query.filter(
            (models.User.name.ilike(search)) |
            (models.User.firstName.ilike(search)) |
            (models.User.lastName.ilike(search)) |
            (models.User.email.ilike(search)) |
            (models.User.dni.ilike(search))
        )

    users = query.order_by(models.User.name).all()
    
    # [OPTIMIZACIÓN] Batch fetching de transacciones para evitar N+1
    user_ids = [u.id for u in users if not u.modality_id]
    transactions_map = {}
    if user_ids:
        # Buscamos la última transacción aprobada para cara usuario en la lista
        # Usamos row_number() o una técnica similar si fuera Postgres puro, 
        # pero para compatibilidad genérica hacemos un map manual post-fetch o un group by.
        # Aquí traemos todas las aprobadas de estos usuarios y nos quedamos con la última.
        recent_txs = db.query(models.Transaction).filter(
            models.Transaction.user_id.in_(user_ids),
            models.Transaction.status == 'approved'
        ).order_by(models.Transaction.created_at.desc()).all()
        
        for tx in recent_txs:
            if tx.user_id not in transactions_map:
                transactions_map[tx.user_id] = tx

    results = []
    for u in users:
        # Priorizar array de roles (V2/V3) sobre eventRole legacy
        roles_list = u.roles if (u.roles and len(u.roles) > 0) else ([u.eventRole] if u.eventRole else ["asistente"])
        
        # 🛡️ AUTO-RECUPERACIÓN EN LISTA (Para usuarios registrados antes de V2)
        final_modality_name = u.registrationType or "Presencial"
        if u.registration_modality:
            final_modality_name = u.registration_modality.title
        elif u.id in transactions_map:
            tx = transactions_map[u.id]
            if tx.items_snapshot:
                snapshot = tx.items_snapshot
                if isinstance(snapshot, dict) and snapshot.get('modality'):
                    mod_data = snapshot.get('modality')
                    if isinstance(mod_data, dict) and mod_data.get('title'):
                        final_modality_name = mod_data.get('title')
                        # Persistencia opcional aquí si se desea, pero por ahora solo visual
        
        user_dict = {
            "id": u.id,
            "email": u.email,
            "dni": u.dni,
            "name": u.name,
            "firstName": u.firstName,
            "lastName": u.lastName,
            "eventRole": u.eventRole,
            "isActive": u.status != 'inactive', 
            "organizerFunction": u.organizerFunction,
            "hasPaid": u.hasPaid,
            "created_at": u.registrationDate,
            "registrationDate": u.registrationDate,
            "specialty": u.specialty,
            "occupation": u.occupation,
            "phone": u.phone,
            "eventRoles": roles_list,
            "roles": u.roles or [],
            "modalityName": final_modality_name
        }
        results.append(user_dict)
        
    return results

# 2. DETALLE DE USUARIO (MODAL)
@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user_detail(user_id: str, db: Session = Depends(get_db)):
    """
    Detalle completo con talleres, modalidad y auditoría.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # 1. Transformar Logs al formato del Schema
    # Obtenemos los últimos 10 movimientos
    logs_db = db.query(models.AuditLog).filter(models.AuditLog.target_user_id == user_id)\
                .order_by(models.AuditLog.timestamp.desc()).limit(10).all()
    
    formatted_logs = []
    for log in logs_db:
        # OPTIMIZACIÓN: Evitar query N+1 si admin_user es None o lazy
        admin_name = "Sistema"
        if log.admin_user_id:
             if log.admin_user:
                 admin_name = log.admin_user.name
             else:
                 admin_name = f"Admin {log.admin_user_id}"
                 
        formatted_logs.append({
            "timestamp": log.timestamp,
            "action": log.action,
            "admin_name": admin_name,
            "details": log.details
        })

    # 2. Mock de Datos Académicos
    mock_abstracts = [
        {"id": "ABS-001", "title": "Neurocisticercosis en Zonas Rurales", "status": "Enviado"},
        {"id": "ABS-045", "title": "Ictus Isquémico: Protocolo 2026", "status": "Aprobado"}
    ] if user.eventRole == "participante" else []
    
    # 3. Auxiliar: Modality & Workshops labels
    modality_label = u"Presencial"
    if user.registration_modality:
        modality_label = user.registration_modality.title
    elif user.registrationType:
        modality_label = user.registrationType
    
    # ESTRATEGIA DE AUTO-RECUPERACIÓN PARA USUARIOS ANTIGUOS
    workshop_ids = user.workshops or []
    if not workshop_ids:
        # Buscamos en su última transacción aprobada
        last_tx = db.query(models.Transaction).filter(
            models.Transaction.user_id == user.id, 
            models.Transaction.status == 'approved'
        ).order_by(models.Transaction.created_at.desc()).first()
        
        if last_tx and last_tx.items_snapshot:
            snapshot = last_tx.items_snapshot
            # Soportar tanto dict como string JSON por si acaso
            if isinstance(snapshot, str):
                import json
                try: snapshot = json.loads(snapshot)
                except: snapshot = {}
            
            if isinstance(snapshot, dict) and snapshot.get('workshops'):
                # Extraemos IDs: [{"id": "ws_1", ...}, ...]
                workshop_ids = [ws.get('id') for ws in snapshot.get('workshops') if ws.get('id')]
                
                # PERSISTENCIA SILENCIOSA: Guardamos en el perfil para no repetir la búsqueda
                try:
                    user.workshops = workshop_ids
                    db.commit()
                    db.refresh(user)
                except Exception as e:
                    db.rollback()
                    print(f"Workshop auto-recovery failed for user {user.id}: {e}")

    # 4. ESTRATEGIA DE AUTO-RECUPERACIÓN DE MODALIDAD (Independiente de talleres)
    if not user.modality_id or modality_label == "Presencial":
        # Buscamos en su última transacción aprobada
        last_tx = db.query(models.Transaction).filter(
            models.Transaction.user_id == user.id, 
            models.Transaction.status == 'approved'
        ).order_by(models.Transaction.created_at.desc()).first()
        
        if last_tx and last_tx.items_snapshot:
            snapshot = last_tx.items_snapshot
            if isinstance(snapshot, str):
                import json
                try: snapshot = json.loads(snapshot)
                except: snapshot = {}
            
            if isinstance(snapshot, dict) and snapshot.get('modality'):
                mod_data = snapshot.get('modality')
                if isinstance(mod_data, dict):
                    if mod_data.get('title'):
                        modality_label = mod_data.get('title')
                    
                    # Persistencia si el ID falta pero está en el snapshot
                    try:
                        if not user.modality_id and mod_data.get('id'):
                            # Validate integer conversion
                            new_mod_id = int(mod_data.get('id'))
                            
                            # Optional: Verify existence if needed, but try-except catches FK errors mostly
                            user.modality_id = new_mod_id
                            db.commit()
                            db.refresh(user)
                    except Exception as e:
                        db.rollback()
                        print(f"Auto-recovery failed for user {user.id}: {e}")

    workshop_names = []
    if workshop_ids:
        # Consultar nombres reales de la tabla Workshops
        db_workshops = db.query(models.Workshop).filter(models.Workshop.id.in_(workshop_ids)).all()
        workshop_names = [ws.name for ws in db_workshops]
        # Fallback si no hay nombres en la BD (aunque debería haberlos)
        if not workshop_names:
            workshop_names = [f"Taller {bid}" for bid in workshop_ids]

    is_active = user.status != 'inactive' and user.status != 'deleted'

    return {
        **user.__dict__,
        "isActive": is_active,
        "eventRoles": user.roles or [user.eventRole] or ["asistente"], # Compatibility shim
        "roles": user.roles or [],
        "participationModality": modality_label,
        "participationModality": modality_label,
        "inscribedWorkshops": workshop_names,
        "ticketType": str(user.modality_id) if user.modality_id else "presencial",
        "modules": user.modules or [],
        "permissions": user.permissions or [],
        # Nuevos campos Nivel 3
        "badgeName": user.name.split(' ')[0] + " " + user.lastName.split(' ')[0], # Default corto
        "participationType": user.eventRole.capitalize() if user.eventRole else "Asistente",
        "submittedAbstracts": mock_abstracts,
        "certificateGenerated": False,
        "lastLogin": "Nunca",
        "auditLog": formatted_logs
    }

# 3. GESTIÓN DE PERMISOS (CON AUDITORÍA)
@router.put("/{user_id}", response_model=UserDetailResponse)
def update_user_permissions(
    user_id: str, 
    payload: UserUpdatePermissions, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Guardamos estado anterior para el log
    old_modules = user.modules
    
    if payload.modules is not None:
        user.modules = payload.modules
    if payload.permissions is not None:
        user.permissions = payload.permissions
    if payload.eventRoles is not None and len(payload.eventRoles) > 0:
        user.eventRole = payload.eventRoles[0]

    # 📝 AUDITORÍA
    create_audit_log(
        db, 
        target_id=user.id, 
        admin_id=current_admin.id, 
        action="CAMBIO_PERMISOS",
        details={"before": old_modules, "after": payload.modules}
    )

        
    db.commit()
    db.refresh(user)
    
    # Reutilizamos la lógica de lectura (llamada interna)
    # Reutilizamos la lógica de lectura (llamada interna)
    return get_user_detail(user_id, db)

# 3.1 GESTIÓN DE ACCESO UNIFICADA (NIVEL 3)
@router.put("/{user_id}/access", response_model=UserDetailResponse)
def update_user_access(
    user_id: str,
    access_data: UserAccessUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(oauth2.get_current_user)
):
    """
    Actualiza Roles y Módulos en una sola transacción atómica ("Cirugía de Acceso").
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 1. Obtener la configuración VIGENTE de la Base de Datos para los roles solicitados
    active_roles_config = db.query(models.RoleProfile).filter(models.RoleProfile.slug.in_(access_data.roles)).all()
    
    # 2. Sanitización y Consolidación de Módulos Mandatorios
    # Empezamos con los módulos que el usuario eligió manualmente
    final_modules = set(access_data.modules)
    
    # Inyectamos los obligatorios de la BD para cada rol asignado
    for role_config in active_roles_config:
        if role_config.mandatory_modules:
            for mandatory in role_config.mandatory_modules:
                final_modules.add(mandatory)
    
    # Filtrar solo módulos válidos (Opcional, pero bueno por seguridad)
    VALID_MODULE_IDS = {
        "organizacion", "investigacion", "academico", 
        "jurado", "contabilidad", "aula_virtual", "trabajos", "secretaria", "mi_perfil", "agenda", "certificados"
    }
    clean_modules = [m for m in final_modules if m in VALID_MODULE_IDS]
    
    # 3. Lógica de negocio (Validación de roles)
    if not access_data.roles:
        raise HTTPException(status_code=400, detail="El usuario debe tener al menos un rol.")

    # Guardar Estado Anterior para Auditoría
    old_roles = user.roles
    old_modules = user.modules

    # 4. Persistencia
    user.roles = access_data.roles
    # Compatibilidad Legacy: Guardamos el primer rol en eventRole para que no rompa la tabla antigua
    if len(access_data.roles) > 0:
        user.eventRole = access_data.roles[0]
        
    user.modules = clean_modules
    
    # 5. Auditoría
    create_audit_log(
        db, 
        target_id=user.id, 
        admin_id=current_admin.id, 
        action="ACCESS_UPDATE",
        details={
            "roles_change": {"from": old_roles, "to": access_data.roles},
            "modules_change": {"from": old_modules, "to": clean_modules}
        }
    )

    db.commit()
    db.refresh(user)
    return get_user_detail(user_id, db)

# 4. RESET PASSWORD (CON AUDITORÍA)
@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: str, 
    payload: Optional[UserResetPassword] = None, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    new_pw = payload.password if payload and payload.password else "123456"
    
    # Usamos utils.hash que es lo que realmente tenemos
    hashed = utils.hash(new_pw)
    user.password = hashed

    # 📝 AUDITORÍA
    create_audit_log(
        db, 
        target_id=user.id, 
        admin_id=current_admin.id, 
        action="RESET_PASSWORD",
        details={"reason": "Solicitud administrativa"}
    )


    db.commit()
    return {"message": f"Contraseña actualizada a {new_pw}"}

# 5. SOFT DELETE
@router.delete("/{user_id}")
def delete_user(
    user_id: str, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(oauth2.get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.status = "deleted"
    
     # 📝 AUDITORÍA
    create_audit_log(
        db, 
        target_id=user.id, 
        admin_id=current_admin.id, 
        action="DELETE_USER",
        details={"type": "soft_delete"}
    )


    db.commit()
    return {"message": "Usuario desactivado (Soft Delete)"}

