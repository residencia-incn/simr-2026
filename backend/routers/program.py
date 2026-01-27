from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional, Dict
from datetime import date, time, datetime, timedelta
import enum

from database import get_db
from models import (
    Location, 
    ScheduleBlock, 
    ProgramActivity, 
    ActivityStatus, 
    ActivityType,
    User,
    ResearchWork,
    SystemConfig
)
from pydantic import BaseModel, validator, Field

router = APIRouter()

# ==========================================
# SCHEMAS (Pydantic)
# ==========================================

# --- Location ---
class LocationCreate(BaseModel):
    name: str
    type: str = "fisica"
    capacity: Optional[int] = None
    urlLink: Optional[str] = None
    color: str = "#3b82f6"

class LocationResponse(LocationCreate):
    id: int
    isActive: bool
    class Config: from_attributes = True

# --- ScheduleBlock ---
class BlockCreate(BaseModel):
    name: str
    date: date
    startTime: time
    endTime: time
    is_break: bool = False

    @validator("endTime")
    def validate_times(cls, v, values):
        if 'startTime' in values and v <= values['startTime']:
            raise ValueError("La hora de fin debe ser posterior a la de inicio")
        return v

class BlockResponse(BlockCreate):
    id: int
    class Config: from_attributes = True

# --- ProgramActivity ---
class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "ponencia"
    status: str = "borrador"
    startTime: datetime
    endTime: datetime
    block_id: int
    location_id: Optional[int] = None
    speaker_id: Optional[str] = None
    external_paper_id: Optional[str] = None
    classification_label: Optional[str] = None

    @validator("endTime")
    def validate_dates(cls, v, values):
        if 'startTime' in values and v <= values['startTime']:
             raise ValueError("Fin debe ser después del inicio")
        return v

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[ActivityType] = None
    status: Optional[ActivityStatus] = None
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    location_id: Optional[int] = None
    speaker_id: Optional[str] = None
    external_paper_id: Optional[str] = None
    # classification_label is usually auto-determined but allow update
    classification_label: Optional[str] = None

class ActivityDetailResponse(ActivityBase):
    id: str
    
    # Objetos anidados
    location: Optional[LocationResponse] = None
    
    # Datos resueltos (Flattened for easier UI consumption)
    speaker_name: Optional[str] = None
    speaker_photo: Optional[str] = None
    
    paper_title_resolved: Optional[str] = None
    paper_author_resolved: Optional[str] = None
    
    class Config: from_attributes = True


# ==========================================
# ENDPOINTS: CONFIG (Days & Limits)
# ==========================================

@router.get("/config")
def get_program_config(db: Session = Depends(get_db)):
    """
    Obtiene la configuración base del evento (Días calculados) 
    y lista de bloques creados para el 'grid'.
    """
    sys_config = db.query(SystemConfig).first()
    if not sys_config or not sys_config.start_date:
        return {"days": [], "blocks": []}

    # Calcular Días del Evento
    days_list = []
    try:
        start = datetime.strptime(sys_config.start_date, "%Y-%m-%d").date()
        duration = sys_config.event_duration or 3
        
        for i in range(duration):
            current_day = start + timedelta(days=i)
            day_num = i + 1
            
            # Default label
            label = f"Día {day_num} ({current_day.strftime('%d/%m')})"
            
            # Try to find custom label from SystemConfig.event_schedule
            if sys_config.event_schedule:
                # event_schedule structure: [{'day': 1, 'label': '...'}, ...]
                schedule_day = next((d for d in sys_config.event_schedule if d.get("day") == day_num), None)
                if schedule_day and schedule_day.get("label"):
                    label = schedule_day.get("label")

            days_list.append({
                "number": day_num,
                "date": current_day.isoformat(),
                "label": label
            })
    except Exception as e:
        print(f"Error calculating dates: {e}")

    # Obtener Todos los Bloques
    blocks = db.query(ScheduleBlock).order_by(ScheduleBlock.date, ScheduleBlock.startTime).all()
    
    # Obtener Todas las Locaciones
    locations = db.query(Location).filter(Location.isActive == True).all()

    return {
        "days": days_list,
        "blocks": [BlockResponse.model_validate(b) for b in blocks],
        "locations": [LocationResponse.model_validate(l) for l in locations]
    }

# ==========================================
# ENDPOINTS: LOCATIONS
# ==========================================

@router.get("/locations", response_model=List[LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    return db.query(Location).filter(Location.isActive == True).all()

@router.post("/locations", response_model=LocationResponse)
def create_location(loc: LocationCreate, db: Session = Depends(get_db)):
    new_loc = Location(**loc.model_dump())
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc

@router.put("/locations/{location_id}", response_model=LocationResponse)
def update_location(location_id: int, payload: LocationCreate, db: Session = Depends(get_db)):
    loc = db.query(Location).get(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Locación no encontrada")
    
    for key, value in payload.model_dump().items():
        setattr(loc, key, value)
    
    db.commit()
    db.refresh(loc)
    return loc

@router.delete("/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).get(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Locación no encontrada")
    
    # Soft delete or hard delete? 'isActive' suggests soft, but let's hard delete for Management UI simplicity if no refs
    # Check refs?
    # For now, just set isActive = False (Soft) to be safe with existing activities
    loc.isActive = False 
    db.commit()
    return {"success": True}

# ==========================================
# ENDPOINTS: BLOCKS (Admin)
# ==========================================

@router.post("/blocks", response_model=BlockResponse)
def create_block(payload: BlockCreate, db: Session = Depends(get_db)):
    # TODO: Validar que la fecha esté dentro del rango del evento (Opcional pero recomendado)
    
    # Crear bloque
    new_block = ScheduleBlock(**payload.model_dump())
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block

@router.delete("/blocks/{block_id}")
def delete_block(block_id: int, force: bool = False, db: Session = Depends(get_db)):
    block = db.query(ScheduleBlock).get(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")
        
    # Verificar si tiene actividades
    activities_count = db.query(ProgramActivity).filter(ProgramActivity.block_id == block_id).count()
    
    if activities_count > 0:
        if not force:
            raise HTTPException(
                status_code=400, 
                detail="No se puede eliminar un bloque con actividades asignadas. Use force=true para eliminar en cascada."
            )
        else:
            # Cascade Delete Activities
            db.query(ProgramActivity).filter(ProgramActivity.block_id == block_id).delete()

    db.delete(block)
    db.commit()
    return {"success": True}

@router.post("/blocks/swap")
def swap_blocks(
    block_id_1: int, 
    block_id_2: int, 
    db: Session = Depends(get_db)
):
    """
    Intercambia los horarios de dos bloques y mueve sus actividades acorde.
    """
    b1 = db.query(ScheduleBlock).get(block_id_1)
    b2 = db.query(ScheduleBlock).get(block_id_2)

    if not b1 or not b2:
        raise HTTPException(status_code=404, detail="Bloques no encontrados")
    
    # Validar que sean del mismo día
    if b1.date != b2.date:
        raise HTTPException(status_code=400, detail="Solo se pueden intercambiar bloques del mismo día.")

    # 1. Guardar tiempos originales
    b1_start_orig = datetime.combine(b1.date, b1.startTime)
    
    b2_start_orig = datetime.combine(b2.date, b2.startTime)

    # 2. Calcular Deltas
    delta_1_to_2 = b2_start_orig - b1_start_orig
    delta_2_to_1 = b1_start_orig - b2_start_orig

    # 3. Mover ACTIVIDADES (Reload para asegurar estado fresco)
    db.refresh(b1)
    db.refresh(b2)
    
    for act in b1.activities:
        if act.startTime and act.endTime:
            act.startTime += delta_1_to_2
            act.endTime += delta_1_to_2

    for act in b2.activities:
        if act.startTime and act.endTime:
            act.startTime += delta_2_to_1
            act.endTime += delta_2_to_1

    # 5. Intercambiar los Tiempos de los Bloques
    temp_start = b1.startTime
    temp_end = b1.endTime
    
    b1.startTime = b2.startTime
    b1.endTime = b2.endTime
    
    b2.startTime = temp_start
    b2.endTime = temp_end

    db.commit()
    
    return {"message": "Bloques intercambiados y actividades reajustadas"}

# ==========================================
# ENDPOINTS: ACTIVITIES (Cruz del Asunto)
# ==========================================

@router.get("/public")
def get_public_schedule(db: Session = Depends(get_db)):
    """
    Retorna el programa agrupado por FECHA.
    Lógica de visualización dinámica: IMPORT RESOLUTION.
    """
    now = datetime.now()
    
    # 1. Filtro de Seguridad (Solo lo publicable)
    activities_query = db.query(ProgramActivity).filter(
        or_(
            ProgramActivity.status == ActivityStatus.PUBLIC,
            and_(
                ProgramActivity.status == ActivityStatus.SCHEDULED,
                ProgramActivity.startTime <= now
            )
        )
    ).order_by(ProgramActivity.startTime.asc())
    
    activities = activities_query.all()
    
    # 2. Agrupación y Resolución Dinámica
    grouped = {}
    
    for act in activities:
        date_key = act.startTime.date().isoformat()
        if date_key not in grouped:
            grouped[date_key] = []
            
        dto = ActivityDetailResponse.model_validate(act)
        
        # A) Resolución de Usuario (Ponente Interno)
        if act.speaker:
            dto.speaker_name = f"{act.speaker.firstName} {act.speaker.lastName}".strip() or act.speaker.name
            dto.speaker_photo = act.speaker.image
            
        # B) Resolución de Paper (Investigación Importada) - OVERRIDE
        if act.paper:
            # Aquí la MAGIA: Sobrescribimos con los datos reales del paper
            author_name = "Autor Desconocido"
            if act.paper.user:
                author_name = f"{act.paper.user.firstName or ''} {act.paper.user.lastName or ''}".strip() or act.paper.user.name or "Autor Desconocido"
            
            dto.paper_title_resolved = act.paper.title
            dto.paper_author_resolved = author_name
            # Opcional: Sobrescribir el título principal para mostrarlo directo en UI simple
            dto.title = act.paper.title 
            dto.description = f"Autor: {author_name}. {act.paper.specialty or ''}"
            
        grouped[date_key].append(dto)
        
    return grouped


@router.post("/activities", response_model=ActivityDetailResponse)
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    # 1. Verificar bloque
    block = db.query(ScheduleBlock).get(payload.block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")
    
    # 2. Validar coherencia temporal estricta
    # La actividad debe estar DENTRO del bloque
    
    # Convertir horas del bloque a datetime completo usando la fecha del bloque
    block_start_dt = datetime.combine(block.date, block.startTime)
    block_end_dt = datetime.combine(block.date, block.endTime)
    
    # Tolerancia de 0seg? O estricto? Estricto por ahora.
    if payload.startTime < block_start_dt or payload.endTime > block_end_dt:
        raise HTTPException(
            status_code=400, 
            detail=f"Horario inválido: La actividad ({payload.startTime.time()} - {payload.endTime.time()}) debe estar dentro del bloque ({block.startTime} - {block.endTime})."
        )

    # 3. Validar COLISIONES de Sala/Horario (Solo Locaciones Físicas)
    if payload.location_id:
        startTime = payload.startTime
        endTime = payload.endTime
        
        # Buscar actividades que se solapen en la misma sala (location_id)
        # Overlap Logic: (StartA < EndB) and (EndA > StartB)
        collision = db.query(ProgramActivity).filter(
            ProgramActivity.location_id == payload.location_id,
            ProgramActivity.startTime < endTime,
            ProgramActivity.endTime > startTime,
            ProgramActivity.status != ActivityStatus.CANCELLED.value
        ).first()
        
        if collision:
            raise HTTPException(
                status_code=400, 
                detail=f"Conflicto de horario: Ya existe la actividad '{collision.title}' en esta sala y horario."
            )

    # 4. Crear
    activity = ProgramActivity(**payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    # Resolver info para el frontend
    dto = ActivityDetailResponse.model_validate(activity)
    if activity.speaker:
        name_parts = [p for p in [activity.speaker.firstName, activity.speaker.lastName] if p]
        dto.speaker_name = " ".join(name_parts) if name_parts else activity.speaker.name
        dto.speaker_photo = activity.speaker.image
        
    return dto

@router.put("/activities/{activity_id}", response_model=ActivityDetailResponse)
def update_activity(activity_id: str, payload: ActivityUpdate, db: Session = Depends(get_db)):
    activity = db.query(ProgramActivity).get(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # Si se actualizan tiempos, validar contra el bloque existente (o nuevo si se cambiara, pero bloque no se actualiza aqui)
    if payload.startTime or payload.endTime:
        start = payload.startTime or activity.startTime
        end = payload.endTime or activity.endTime
        
        block = activity.block # Usar relación ORM
        block_start_dt = datetime.combine(block.date, block.startTime)
        block_end_dt = datetime.combine(block.date, block.endTime)
        
        if start < block_start_dt or end > block_end_dt:
             raise HTTPException(status_code=400, detail="El nuevo horario sale del rango del bloque asignado.")

    # 2. Validar COLISIONES de Sala/Horario si se cambia horario o locación
    loc_id = payload.location_id if payload.location_id is not None else activity.location_id
    start = payload.startTime or activity.startTime
    end = payload.endTime or activity.endTime

    if loc_id:
        collision = db.query(ProgramActivity).filter(
            ProgramActivity.id != activity_id, # Ignorar la propia actividad
            ProgramActivity.location_id == loc_id,
            ProgramActivity.startTime < end,
            ProgramActivity.endTime > start,
            ProgramActivity.status != ActivityStatus.CANCELLED.value
        ).first()
        
        if collision:
            raise HTTPException(
                status_code=400, 
                detail=f"Conflicto de horario: Ya existe la actividad '{collision.title}' en esta sala y horario."
            )

    # Mapping manual de campos update
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(activity, key, value)

    db.commit()
    db.refresh(activity)
    
    # Resolver info para el frontend
    dto = ActivityDetailResponse.model_validate(activity)
    if activity.speaker:
        name_parts = [p for p in [activity.speaker.firstName, activity.speaker.lastName] if p]
        dto.speaker_name = " ".join(name_parts) if name_parts else activity.speaker.name
        dto.speaker_photo = activity.speaker.image
        
    return dto

@router.delete("/activities/{activity_id}")
def delete_activity(activity_id: str, db: Session = Depends(get_db)):
    activity = db.query(ProgramActivity).get(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    
    db.delete(activity)
    db.commit()
    return {"success": True}

# Endpoint para vista ADMIN (Sin filtros, lista plana o por día)
@router.get("/activities/admin")
def get_admin_activities(day: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ProgramActivity)
    
    if day:
        # Filtrar por fecha exacta YYYY-MM-DD
        # Asumiendo startTime es datetime
         query = query.filter(func.date(ProgramActivity.startTime) == day)
    
    activities = query.order_by(ProgramActivity.startTime.asc()).all()
    
    # Retornamos formato detallado y resolvemos nombres
    response = []
    for act in activities:
        dto = ActivityDetailResponse.model_validate(act)
        
        # Resolución similar a vista pública
        if act.speaker:
             # Priorizar firstName + lastName, fallback a name
            name_parts = [p for p in [act.speaker.firstName, act.speaker.lastName] if p]
            dto.speaker_name = " ".join(name_parts) if name_parts else act.speaker.name
            dto.speaker_photo = act.speaker.image
            
        if act.paper:
            author_name = "Autor Desconocido"
            if act.paper.user:
                author_name = f"{act.paper.user.firstName or ''} {act.paper.user.lastName or ''}".strip() or act.paper.user.name or "Autor Desconocido"
                
            dto.paper_title_resolved = act.paper.title
            dto.paper_author_resolved = author_name
            
        response.append(dto)

    return response
