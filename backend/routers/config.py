from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SystemConfig, Workshop, RegistrationModality, RoleProfile

router = APIRouter()

# --- CONSTANTS ---
SYSTEM_MODULES_LIST = [
    {"id": "organizacion", "label": "Gestión Organización"},
    {"id": "investigacion", "label": "Investigación"},
    {"id": "academico", "label": "Académico"},
    {"id": "jurado", "label": "Sala de Jurados"},
    {"id": "contabilidad", "label": "Contabilidad / Tesorería"},
    {"id": "aula_virtual", "label": "Aula Virtual"},
    {"id": "trabajos", "label": "Envío de Trabajos"},
    {"id": "secretaria", "label": "Secretaría"},
    {"id": "mi_perfil", "label": "Mi Perfil"},
    {"id": "certificados", "label": "Certificados"},
    {"id": "asistencia", "label": "Admisión y Asistencia"}
]

# --- HELPER FUNCTIONS ---
def get_or_create_system_config(db: Session):
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

# --- ENDPOINTS ---

@router.get("/")
def get_system_config(db: Session = Depends(get_db)):
    """Configuración general del sistema (Consolidada)."""
    # 1. Main Config
    sys_config = get_or_create_system_config(db)
    
    # 2. Workshops
    workshops = db.query(Workshop).all()
    
    # 3. Modalities
    modalities = db.query(RegistrationModality).all()
    
    # 4. Roles
    roles = db.query(RoleProfile).all()
    
    # Construct Unified Response (matching frontend camelCase/structure)
    response = {
        # General
        "event_name": sys_config.event_name,
        "event_year": sys_config.event_year,
        "start_date": sys_config.start_date,
        "show_countdown": sys_config.show_countdown,
        "event_duration": sys_config.event_duration,
        "event_schedule": sys_config.event_schedule or [],
        "public_sections": sys_config.public_sections or [],
        
        # Lists
        "allowed_roles": sys_config.allowed_roles or [],
        "allowed_roles": sys_config.allowed_roles or [],
        "allowed_specialties": sys_config.allowed_specialties or [], # Academic Specialties
        "allowed_occupations": sys_config.allowed_occupations or [], # New
        "residency_years": sys_config.residency_years or [], # New
        "participant_specialties": sys_config.participant_specialties or [], # New
        "allowed_institutions": sys_config.allowed_institutions or [], # New
        "allowed_universities": sys_config.allowed_universities or [], # New
        "workshops": [
            {
                "id": w.id, 
                "name": w.name, 
                "price": w.price, 
                "description": w.description, 
                "category": w.category,
                "is_active": w.is_active
            } for w in workshops
        ],
        "registration_modalities": [
            {
                "id": m.code, # Map SQL 'code' -> Frontend 'id'
                "code": m.code,
                "name": m.title, # Map SQL 'title' -> Frontend 'name'
                "title": m.title,
                "subtitle": m.subtitle,
                "price": m.price,
                "description": m.description,
                "includes_certificate": m.includes_certificate
            } for m in modalities
        ],
        "roles": [
            {
                "id": r.id,
                "name": r.name,
                "slug": r.slug,
                "description": r.description,
                "default_modules": r.default_modules,
                "mandatory_modules": r.mandatory_modules,
                "priority": r.priority
            } for r in roles
        ]
    }
    return response

@router.put("/")
def update_system_config(config: dict, db: Session = Depends(get_db)):
    """Actualizar configuración general y listas (Full Persistencia)."""
    # 1. Update Main Config
    sys_config = get_or_create_system_config(db)
    
    # Mapping
    if "event_name" in config: sys_config.event_name = config["event_name"]
    if "event_year" in config: sys_config.event_year = config["event_year"]
    if "start_date" in config: sys_config.start_date = config["start_date"]
    if "show_countdown" in config: sys_config.show_countdown = config["show_countdown"]
    if "event_duration" in config: sys_config.event_duration = config["event_duration"]
    if "event_schedule" in config: sys_config.event_schedule = config["event_schedule"]
    if "public_sections" in config: sys_config.public_sections = config["public_sections"]
    if "allowed_roles" in config: sys_config.allowed_roles = config["allowed_roles"]
    if "allowed_roles" in config: sys_config.allowed_roles = config["allowed_roles"]
    if "allowed_specialties" in config: sys_config.allowed_specialties = config["allowed_specialties"]
    if "allowed_occupations" in config: sys_config.allowed_occupations = config["allowed_occupations"]
    if "residency_years" in config: sys_config.residency_years = config["residency_years"]
    if "participant_specialties" in config: sys_config.participant_specialties = config["participant_specialties"]
    if "allowed_institutions" in config: sys_config.allowed_institutions = config["allowed_institutions"]
    if "allowed_universities" in config: sys_config.allowed_universities = config["allowed_universities"]
    
    # 2. Update Workshops (Delete All + Insert Strategy for robustness)
    if "workshops" in config:
        db.query(Workshop).delete()
        for w in config["workshops"]:
            new_w = Workshop(
                id=w.get("id"),
                name=w.get("name"),
                price=w.get("price", 0),
                description=w.get("description"),
                category=w.get("category"),
                is_active=w.get("is_active", True)
            )
            db.add(new_w)
            
    # 3. Update Modalities (Delete All + Insert)
    if "registration_modalities" in config:
        db.query(RegistrationModality).delete()
        for m in config["registration_modalities"]:
            # Frontend sends 'id' -> Map to 'code'
            # Frontend sends 'title' (or 'name') -> Map to 'title'
            new_m = RegistrationModality(
                code=m.get("id"), 
                title=m.get("title") or m.get("name"), # Handle both
                subtitle=m.get("subtitle"), # Add subtitle
                price=m.get("price", 0),
                description=m.get("description"),
                includes_certificate=m.get("includes_certificate", False)
            )
            db.add(new_m)
            
    db.commit()
    db.refresh(sys_config)
    
    # Return updated config to confirm
    return get_system_config(db)

# --- INDIVIDUAL LIST ENDPOINTS (REQUIRED BY FRONTEND API.JS) ---

@router.get("/workshops")
def get_workshops_config(db: Session = Depends(get_db)):
    return db.query(Workshop).all()

@router.put("/workshops")
def update_workshops(workshops: list, db: Session = Depends(get_db)):
    db.query(Workshop).delete()
    for w in workshops:
        new_w = Workshop(
            id=w.get("id"),
            name=w.get("name"),
            price=w.get("price", 0),
            description=w.get("description"),
            category=w.get("category")
        )
        db.add(new_w)
    db.commit()
    return db.query(Workshop).all()

@router.get("/modalities")
def get_modalities(db: Session = Depends(get_db)):
    modalities = db.query(RegistrationModality).all()
    # Map SQL 'code' -> Frontend 'id' for consistency
    return [
        {
            "id": m.code, 
            "code": m.code,
            "name": m.title, 
            "title": m.title,
            "subtitle": m.subtitle,
            "price": m.price,
            "description": m.description,
            "includes_certificate": m.includes_certificate,
            "is_active": m.is_active
        } for m in modalities
    ]

# --- ROLES ---
@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    return db.query(RoleProfile).all()

@router.post("/roles")
def create_role(role: dict, db: Session = Depends(get_db)):
    new_role = RoleProfile(
        name=role.get("name"),
        slug=role.get("slug"),
        description=role.get("description"),
        default_modules=role.get("default_modules"),
        mandatory_modules=role.get("mandatory_modules"),
        default_modality_id=role.get("default_modality_id"),
        default_workshops=role.get("default_workshops"),
        priority=role.get("priority", 99)
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.put("/roles/{role_id}")
def update_role(role_id: int, role_data: dict, db: Session = Depends(get_db)):
    role = db.query(RoleProfile).filter(RoleProfile.id == role_id).first()
    if not role:
        # Fallback if specific ID not found, typically create new
        raise HTTPException(status_code=404, detail="Role not found")
    
    role.name = role_data.get("name", role.name)
    role.default_modules = role_data.get("default_modules", role.default_modules)
    role.mandatory_modules = role_data.get("mandatory_modules", role.mandatory_modules)
    role.default_modality_id = role_data.get("default_modality_id", role.default_modality_id)
    role.default_workshops = role_data.get("default_workshops", role.default_workshops)
    role.description = role_data.get("description", role.description)
    role.priority = role_data.get("priority", role.priority)
    
    db.commit()
    db.refresh(role)
    return role

@router.get("/roles-matrix")
def get_roles_matrix(db: Session = Depends(get_db)):
    """
    Obtiene la configuración DINÁMICA de roles desde la Base de Datos.
    Si agregas un rol nuevo en 'Configuración', aparecerá aquí automáticamente.
    """
    roles_db = db.query(RoleProfile).all()
    
    # Transformamos la lista de la BD a un diccionario clave-valor para fácil uso en Frontend
    roles_map = {}
    for role in roles_db:
        roles_map[role.slug] = {
            "name": role.name,
            "label": role.name, # For frontend compatibility
            "description": role.description,
            "priority": role.priority,
            "default_modules": role.default_modules,
            "mandatory_modules": role.mandatory_modules
        }
        
    return {
        "roles": roles_map,
        "all_modules": SYSTEM_MODULES_LIST
    }

@router.get("/catalog")
def get_sales_catalog(db: Session = Depends(get_db)):
    """
    Obtiene lista unificada de todo lo vendible (Modalidades + Talleres)
    para llenar los selectores del generador de cupones.
    """
    catalog = []

    # 1. Obtener Modalidades Activas
    try:
        mods = db.query(RegistrationModality).filter(RegistrationModality.is_active == True).all()
        for m in mods:
            catalog.append({
                "id": f"modalidad:{m.code}",  # CLAVE COMPUESTA USANDO CODE (t_...)
                "type": "INSCRIPTION",
                "label": f"Inscripción: {m.title}",
                "price": float(m.price),
                "original_id": m.id
            })
    except Exception as e:
        print(f"Error cargando modalidades: {e}")

    # 2. Obtener Talleres Activos
    try:
        workshops = db.query(Workshop).filter(Workshop.is_active == True).all()
        for w in workshops:
            catalog.append({
                "id": f"taller:{w.id}",      # CLAVE COMPUESTA
                "type": "WORKSHOP",
                "label": f"Taller: {w.name}", # Workshop model uses 'name', not 'title'
                "price": float(w.price),
                "original_id": w.id
            })
    except Exception as e:
        print(f"Error cargando talleres: {e}")

    return catalog
