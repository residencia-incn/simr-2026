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
    ResearchWork as ResearchWorkModel,
    SystemConfig,
    AcademicConfig as AcademicConfigModel
)
from models_academic import Rubric, JuryAssignment, Evaluation, AcademicSetting, SpeakerLecture
from models_research import Submission as SubmissionModel, SubmissionType
from models import ResearchWork as ResearchWorkModel # Keep for reference or fallback if needed

from schemas import User as UserSchema
from schemas.academic import (
    RubricCreate, RubricResponse, JuryAssignRequest, EvaluationBulkCreate, 
    SpeakerCreate, SpeakerLectureCreate, SpeakerLectureResponse,
    AcademicSettingResponse, AcademicSettingBase
)
from pydantic import BaseModel, validator, Field
from dependencies import require_module, require_any_module, get_current_user

router = APIRouter()

# --- SCHEMAS ---

class ResearchWork(BaseModel):
    id: str
    title: str
    author: str
    type: str
    specialty: str
    status: str

class SectionSchema(BaseModel):
    id: str
    label: str
    limit: int
    type: str = "text"
    active: bool = True
    workTypes: List[str] = []

class DeclarationSchema(BaseModel):
    id: str
    text: str
    required: bool = True

class AcademicConfigSchema(BaseModel):
    titleWordLimit: int = 20
    submissionDeadline: Optional[str] = None
    extensionEnabled: bool = False
    extensionDeadline: Optional[str] = None
    latePenalty: Optional[float] = 0.0
    sections: List[SectionSchema] = []
    workTypes: List[str] = []
    declarations: List[DeclarationSchema] = []

# --- HELPERS ---

def get_or_create_academic_config(db: Session):
    config = db.query(AcademicConfigModel).first()
    if not config:
        config = AcademicConfigModel(
            id=1,
            titleWordLimit=20,
            workTypes=["Trabajo Original", "Reporte de Caso", "Revisión Sistemática"],
            sections=[
                {"id": "intro", "label": "Introducción", "limit": 250, "type": "text", "active": True, "workTypes": ["Trabajo Original"]},
                {"id": "metodos", "label": "Métodos", "limit": 300, "type": "text", "active": True, "workTypes": ["Trabajo Original"]},
                {"id": "resultados", "label": "Resultados", "limit": 400, "type": "text", "active": True, "workTypes": ["Trabajo Original"]}
            ],
            declarations=[
                {"id": "decl1", "text": "Declaro que el trabajo es original y no ha sido publicado.", "required": True},
                {"id": "decl2", "text": "Declaro que no tengo conflicto de intereses.", "required": True}
            ]
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

# --- ENDPOINTS ---

@router.get("/config", response_model=AcademicConfigSchema)
def get_academic_config(db: Session = Depends(get_db)):
    """Obtiene la configuración académica."""
    return get_or_create_academic_config(db)

@router.put("/config", response_model=AcademicConfigSchema)
def update_academic_config(config_data: AcademicConfigSchema, db: Session = Depends(get_db)):
    """Actualiza la configuración académica."""
    config = get_or_create_academic_config(db)
    
    config.titleWordLimit = config_data.titleWordLimit
    config.submissionDeadline = config_data.submissionDeadline
    config.extensionEnabled = config_data.extensionEnabled
    config.extensionDeadline = config_data.extensionDeadline
    config.latePenalty = config_data.latePenalty
    
    # Convert Pydantic models to dict for JSON columns
    config.sections = [s.dict() for s in config_data.sections]
    config.workTypes = config_data.workTypes
    config.declarations = [d.dict() for d in config_data.declarations]
    
    db.commit()
    db.refresh(config)
    return config

@router.post("/rubrics", response_model=RubricResponse)
def create_rubric(rubric: RubricCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Validar permisos (Solo Admin o Comité Académico) - Simplificado por ahora
    new_rubric = Rubric(**rubric.dict())
    db.add(new_rubric)
    db.commit()
    db.refresh(new_rubric)
    return new_rubric

@router.get("/rubrics", response_model=List[RubricResponse])
def get_rubrics(work_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Rubric).filter(Rubric.is_active == True)
    if work_type:
        # Buscamos si el tipo está dentro del array JSON
        from sqlalchemy import cast, String
        # Usamos contains que funciona bien con JSONB en Postgres
        query = query.filter(Rubric.work_types.contains([work_type]))
    return query.all()

@router.put("/rubrics/{rubric_id}", response_model=RubricResponse)
def update_rubric(rubric_id: str, rubric_update: RubricCreate, db: Session = Depends(get_db)):
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rúbrica no encontrada")
    
    for key, value in rubric_update.dict().items():
        setattr(rubric, key, value)
    
    db.commit()
    db.refresh(rubric)
    return rubric

@router.delete("/rubrics/{rubric_id}")
def delete_rubric(rubric_id: str, db: Session = Depends(get_db)):
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rúbrica no encontrada")
    
    # Soft delete
    rubric.is_active = False # Assuming is_active handles "deletion"
    # Or physical delete if strictly requested, but soft is better.
    # The get_rubrics filters by is_active=True so this works safely.
    db.commit()
    return {"message": "Rúbrica eliminada"}

@router.post("/assign-jury")
def assign_jury(assignment: JuryAssignRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Verificar si ya existe la asignación
    exists = db.query(JuryAssignment).filter(
        JuryAssignment.work_id == assignment.work_id,
        JuryAssignment.jury_user_id == assignment.jury_user_id
    ).first()
    
    if exists:
        raise HTTPException(status_code=400, detail="El jurado ya está asignado a este trabajo.")

    # 2. Verificar configuración de límite de jurados
    config_juries = db.query(AcademicSetting).filter(AcademicSetting.key == "jurados_por_trabajo").first()
    limit = int(config_juries.value) if config_juries else 3
    
    current_count = db.query(JuryAssignment).filter(JuryAssignment.work_id == assignment.work_id).count()
    
    if current_count >= limit:
        raise HTTPException(status_code=400, detail=f"Límite de jurados ({limit}) alcanzado para este trabajo.")

    new_assignment = JuryAssignment(**assignment.dict())
    db.add(new_assignment)
    db.commit()
    return {"message": "Jurado asignado correctamente"}

@router.put("/works/{work_id}/juries")
def sync_work_juries(work_id: str, jury_ids: List[str], db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Sincroniza la lista completa de jurados para un trabajo.
    Elimina los que no están en la lista y agrega los nuevos.
    """
    # 1. Verificar que el trabajo existe
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == work_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")

    # 2. Verificar configuración de límite de jurados
    config_juries = db.query(AcademicSetting).filter(AcademicSetting.key == "jurados_por_trabajo").first()
    limit = int(config_juries.value) if config_juries else 3
    
    if len(jury_ids) > limit:
        raise HTTPException(status_code=400, detail=f"No se pueden asignar más de {limit} jurados (límite actual del sistema).")

    # 3. Obtener asignaciones actuales
    current_assignments = db.query(JuryAssignment).filter(JuryAssignment.work_id == work_id).all()
    current_jury_ids = {a.jury_user_id for a in current_assignments}
    new_jury_ids = set(jury_ids)

    # 4. Eliminar jurados que ya no están (Solo si no tienen evaluaciones para no romper datos)
    # Por ahora permitimos eliminar si el comité lo decide, pero idealmente advertiríamos.
    for a in current_assignments:
        if a.jury_user_id not in new_jury_ids:
            # Verificar si tiene evaluaciones
            has_evals = db.query(Evaluation).filter(Evaluation.assignment_id == a.id).count() > 0
            if has_evals:
                # Opcional: Impedir borrado si hay evaluaciones, o borrar en cascada.
                # Como es un dashboard administrativo, permitimos el borrado pero con precaución.
                db.query(Evaluation).filter(Evaluation.assignment_id == a.id).delete()
            
            db.delete(a)

    # 5. Agregar nuevos jurados
    for jid in new_jury_ids:
        if jid not in current_jury_ids:
            new_assign = JuryAssignment(work_id=work_id, jury_user_id=jid)
            db.add(new_assign)

    db.commit()
    return {"message": "Lista de jurados actualizada correctamente"}

@router.post("/speakers", response_model=UserSchema)
def create_speaker(speaker: SpeakerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Verificar si email existe
    existing_user = db.query(User).filter(User.email == speaker.email).first()
    
    if existing_user:
        # Si existe, añadir rol "ponente"
        current_roles = list(existing_user.roles or [])
        if "ponente" not in current_roles:
            current_roles.append("ponente")
            existing_user.roles = current_roles
            db.commit()
            db.refresh(existing_user)
        return existing_user

    # 2. Crear nuevo usuario si no existe
    import secrets
    import auth # Import auth utils for password hashing if needed, or use default logic
    from auth import get_password_hash # type: ignore
    
    new_id = f"Spk_{secrets.token_hex(4)}"
    password = speaker.dni # DNI as default password
    
    new_user = User(
        id=new_id,
        name=f"{speaker.first_name} {speaker.last_name}",
        firstName=speaker.first_name,
        lastName=speaker.last_name,
        email=speaker.email,
        dni=speaker.dni,
        password=get_password_hash(password),
        roles=["ponente", "asistente"],
        specialty=speaker.specialty,
        occupation=speaker.occupation,
        institution=speaker.institution,
        cmp_number=speaker.cmp,
        rne_number=speaker.rne,
        residencyYear=speaker.residency_year,
        eventRole="ponente" if not speaker.is_international else "ponente_internacional",
        modules=["mi_perfil", "aula_virtual"],
        status="active",
        registrationDate=datetime.now()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users/jury", response_model=List[UserSchema])
def get_juries(db: Session = Depends(get_db)):
    # Assuming role filtering logic works on JSON column in Postgres or simple string check
    # Logic might vary depending on DB version, here simple retrieval and filtering in python if necessary
    # Or using a custom filter query.
    # For now, fetching all and filtering in python for safety if JSON operators aren't trusted yet in this codebase context
    all_users = db.query(User).all() 
    juries = [u for u in all_users if "jurado" in (u.roles or [])]
    return juries


@router.post("/jurors", response_model=UserSchema)
def create_juror(juror: SpeakerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Reusing SpeakerCreate schema as it has the same fields (User fields)
    # 1. Verificar si email existe
    existing_user = db.query(User).filter(User.email == juror.email).first()
    
    if existing_user:
        if "jurado" not in existing_user.roles:
            roles = list(existing_user.roles)
            roles.append("jurado")
            existing_user.roles = roles
            db.commit()
            db.refresh(existing_user)
        return existing_user

    # 2. Crear nuevo usuario
    import secrets
    from auth import get_password_hash # type: ignore
    
    new_id = f"Jur_{secrets.token_hex(4)}"
    password = juror.dni
    
    new_user = User(
        id=new_id,
        firstName=juror.first_name,
        lastName=juror.last_name,
        email=juror.email,
        dni=juror.dni,
        password=get_password_hash(password),
        name=f"{juror.first_name} {juror.last_name}",
        roles=["jurado", "asistente"],
        specialty=juror.specialty,
        occupation=juror.occupation,
        institution=juror.institution,
        cmp_number=juror.cmp,
        rne_number=juror.rne,
        residencyYear=juror.residency_year,
        eventRole="jurado",
        modules=["mi_perfil", "jurado"],
        status="active",
        registrationDate=datetime.now()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/assignments/{assignment_id}/evaluate")
def evaluate_work(assignment_id: int, payload: EvaluationBulkCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Guarda la evaluación completa de un jurado para un trabajo.
    """
    # 1. Verificar asignación
    assignment = db.query(JuryAssignment).filter(JuryAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    # Solo el jurado asignado puede calificar
    if assignment.jury_user_id != current_user.id and "admin" not in (current_user.roles or []):
        raise HTTPException(status_code=403, detail="No tiene permiso para calificar este trabajo")

    # 1.1 Obtener el trabajo para validar rubricas
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == assignment.work_id).first()
    if not submission:
         raise HTTPException(status_code=404, detail="Trabajo de investigación no encontrado")
         
    work_type = submission.submission_type.name if submission.submission_type else submission.type
    
    # 1.2 Obtener rúbricas válidas para este tipo de trabajo
    # Usamos la misma logica de filtrado que en get_rubrics
    valid_rubrics = db.query(Rubric).filter(Rubric.is_active == True).all()
    # Filtrar en python para asegurar coincidencia exacta si JSON contiene
    valid_rubrics_map = {
        r.id: r for r in valid_rubrics 
        if work_type in (r.work_types or [])
    }
    
    # 2. Guardar/Actualizar evaluaciones
    # BLOQUEO DE SEGURIDAD (Security Lock)
    if assignment.status == "CALIFICADO" and "admin" not in (current_user.roles or []):
         raise HTTPException(status_code=409, detail="La evaluación ya ha sido enviada y está FINALIZADA. No se permiten cambios.")

    # Limpiamos si ya existían para este jurado (Solo si admin forza o primera vez, pero el check de arriba protege)
    db.query(Evaluation).filter(Evaluation.assignment_id == assignment_id).delete()
    
    total_score = 0
    
    # Set para validar duplicados
    processed_rubrics = set()
    
    # Preparar datos para firma y backup
    backup_payload = {
        "assignment_id": assignment_id,
        "jury_id": assignment.jury_user_id,
        "work_id": assignment.work_id,
        "scores": [],
        "timestamp": datetime.now().isoformat()
    }

    for item in payload.scores:
        # Validación de Rúbrica
        if item.rubric_id not in valid_rubrics_map:
            raise HTTPException(
                status_code=400, 
                detail=f"La rúbrica ID {item.rubric_id} no es válida para el tipo de trabajo '{work_type}'"
            )
            
        rubric = valid_rubrics_map[item.rubric_id]
        
        # Validación de Límites (Bounds Check)
        if item.score < 0 or item.score > rubric.max_score:
             raise HTTPException(
                status_code=400, 
                detail=f"El puntaje {item.score} para '{rubric.title}' está fuera del rango permitido (0 - {rubric.max_score})"
            )
        
        if item.rubric_id in processed_rubrics:
             raise HTTPException(status_code=400, detail=f"Rúbrica duplicada en el payload: {item.rubric_id}")
        
        processed_rubrics.add(item.rubric_id)

        new_eval = Evaluation(
            assignment_id=assignment_id,
            rubric_id=item.rubric_id,
            score=item.score,
            comments=payload.comment
        )
        db.add(new_eval)
        
        # Agregar a backup
        backup_payload["scores"].append({
            "rubric_id": item.rubric_id,
            "score": item.score,
            "title": rubric.title
        })

        # CÁLCULO EN SERVIDOR (Server-side Calculation)
        total_score += item.score
    
    # FIRMA CRIPTOGRÁFICA (HMAC Signing)
    import hashlib
    import hmac
    import json
    
    # Secret key should be in env vars, using a hardcoded fallback for demo context (BUT SHOULD BE SECURE)
    SECRET_KEY = "SIMR_2026_SECURE_EVALUATION_KEY" 
    
    # Canonical string for signing
    message = json.dumps(backup_payload, sort_keys=True)
    signature = hmac.new(SECRET_KEY.encode(), message.encode(), hashlib.sha256).hexdigest()
    
    # 3. Actualizar estado de asignación y guardar firma
    assignment.status = "CALIFICADO"
    assignment.signature = signature
    
    # 3.1 Guardar Backup
    from models_academic import EvaluationBackup
    new_backup = EvaluationBackup(
        assignment_id=assignment_id,
        backup_data=backup_payload,
        signature=signature
    )
    db.add(new_backup)
    
    # 4. Actualizar puntaje promedio en el trabajo principal (Submission)
    # recalculamos TODOS los promedios desde la base de datos para asegurar integridad
    db.flush() # Asegurar que las nuevas evaluaciones están "visibles" para la siguiente query en la misma transacción
    
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == assignment.work_id).first()
    if submission:
        # Obtener todas las asignaciones calificadas para este trabajo
        all_assignments = db.query(JuryAssignment).filter(
            JuryAssignment.work_id == assignment.work_id,
            JuryAssignment.status == "CALIFICADO"
        ).all()
        
        total_sum = 0
        juror_count = 0
        
        for a in all_assignments:
            # Sumar puntaje de este jurado DIRECTAMENTE DE LA BD
            a_score = db.query(func.sum(Evaluation.score)).filter(Evaluation.assignment_id == a.id).scalar() or 0
            total_sum += a_score
            juror_count += 1
            
        if juror_count > 0:
            final_avg = total_sum / juror_count
            submission.juror_score = final_avg
            submission.final_score = final_avg # Sync both for consistency
    
    db.commit()
    return {"message": "Evaluación enviada con éxito (Bloqueada y Firmada)", "total_score": total_score, "signature": signature}

@router.get("/users/speakers", response_model=List[UserSchema])
def get_speakers(db: Session = Depends(get_db)):
    all_users = db.query(User).all()
    speakers = [u for u in all_users if "ponente" in (u.roles or [])]
    return speakers

@router.get("/works", response_model=List[dict])
def get_research_works(status: Optional[str] = None, juror_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Lista trabajos de investigación desde la tabla de Submissions (Investigación V2).
    Filtra por estado (ej: 'ACEPTADO') y opcionalmente por jurado asignado.
    """
    # Usamos SubmissionModel (research_submissions) que es la fuente de verdad actual
    query = db.query(SubmissionModel).outerjoin(User, SubmissionModel.user_id == User.id)
    
    if status:
        query = query.filter(func.lower(SubmissionModel.status) == status.lower())
    
    if juror_id:
        # Unir con JuryAssignment para filtrar por jurado
        query = query.join(JuryAssignment, JuryAssignment.work_id == SubmissionModel.id).filter(JuryAssignment.jury_user_id == juror_id)

    results = query.all()
    
    output = []
    for s in results:
        # 1. Datos del Autor
        author_name = "Autor Desconocido"
        if s.user:
            author_name = f"{s.user.firstName or ''} {s.user.lastName or ''}".strip() or s.user.name or "Usuario Sin Nombre"
        
        # 2. Jurados y Evaluaciones (Desde models_academic)
        assignments = db.query(JuryAssignment).filter(JuryAssignment.work_id == s.id).all()
        jury_ids = [a.jury_user_id for a in assignments]
        
        my_assignment_id = None
        if juror_id:
            # Encontrar el ID de asignación específico para este jurado solicitado
            my_assign = next((a for a in assignments if a.jury_user_id == juror_id), None)
            if my_assign:
                my_assignment_id = my_assign.id
        
        evaluations_data = []
        for a in assignments:
            # Solo incluir si está calificado o tiene evaluaciones
            assignment_evals = db.query(Evaluation).filter(Evaluation.assignment_id == a.id).all()
            if not assignment_evals:
                continue
                
            juror = db.query(User).filter(User.id == a.jury_user_id).first()
            juror_name = "Jurado"
            if juror:
                juror_name = f"{juror.firstName or ''} {juror.lastName or ''}".strip() or juror.name
                
            total_juror_score = 0
            detailed_scores = {}
            global_comment = ""
            for e in assignment_evals:
                rubric_name = e.rubric.title if e.rubric else f"CR-{e.rubric_id}"
                detailed_scores[rubric_name] = float(e.score)
                total_juror_score += float(e.score)
                if e.comments:
                    global_comment = e.comments
            
            evaluations_data.append({
                "id": a.id,
                "juror_id": a.jury_user_id,
                "jurorName": juror_name,
                "totalScore": total_juror_score,
                "scores": detailed_scores,
                "comment": global_comment,
                "date": a.assigned_at # O el de la evaluación
            })

        # 3. Datos de Programa (Horario y Sala)
        activity = db.query(ProgramActivity).filter(ProgramActivity.external_paper_id == s.id).first()
        day = activity.block.date.isoformat() if activity and activity.block else None
        time_str = f"{activity.startTime.strftime('%H:%M')} - {activity.endTime.strftime('%H:%M')}" if activity else None
        room = activity.location.name if activity and activity.location else None

        # 4. Mapeo al formato esperado por el frontend
        output.append({
            "id": s.id,
            "title": s.title or "Sin título",
            "author": author_name,
            "author_id": s.user_id,
            "type": s.submission_type.name if s.submission_type else "General",
            "type_name": s.submission_type.name if s.submission_type else "General",
            "specialty": s.specialty or "General",
            "status": s.status,
            "submitted_at": s.submitted_at,
            "values": {}, # Los detalles se cargan bajo demanda o vía abstract en el modelo original
            "jury": jury_ids,
            "evaluations": evaluations_data,
            "user_id": s.user_id,
            "is_late_submission": getattr(s, 'is_late_submission', False),
            "juror_score": float(s.juror_score) if s.juror_score else 0.0,
            "final_score": float(s.final_score) if s.final_score else 0.0,
            "day": day,
            "time": time_str,
            "room": room,
            "activity_id": activity.id if activity else None,
            "block_id": activity.block_id if activity else None,
            "location_id": activity.location_id if activity else None,
            "my_assignment_id": my_assignment_id
        })
    return output

class ScheduleWorkRequest(BaseModel):
    block_id: int
    location_id: int

@router.post("/works/{work_id}/schedule")
def schedule_work(work_id: str, payload: ScheduleWorkRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Asigna un trabajo al programa científico creando o actualizando una ProgramActivity.
    """
    # 1. Verificar trabajo
    submission = db.query(SubmissionModel).filter(SubmissionModel.id == work_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    # 2. Verificar bloque y locación
    block = db.query(ScheduleBlock).get(payload.block_id)
    if not block:
         raise HTTPException(status_code=404, detail="Bloque de horario no encontrado")
         
    location = db.query(Location).get(payload.location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Sala/Auditorio no encontrado")

    # 3. Buscar activity existente o crear una
    activity = db.query(ProgramActivity).filter(ProgramActivity.external_paper_id == work_id).first()
    
    start_dt = datetime.combine(block.date, block.startTime)
    end_dt = datetime.combine(block.date, block.endTime)

    # Determine classification label (Work Type)
    work_type_label = "Trabajo Original"
    if submission.submission_type and submission.submission_type.name:
        work_type_label = submission.submission_type.name
    elif submission.type:
        work_type_label = submission.type

    if activity:
        activity.block_id = payload.block_id
        activity.location_id = payload.location_id
        activity.startTime = start_dt
        activity.endTime = end_dt
        activity.title = submission.title or "Presentación de Trabajo"
        activity.speaker_id = submission.user_id # Assign speaker from author
        activity.classification_label = work_type_label # Assign work type
    else:
        activity = ProgramActivity(
            title=submission.title or "Presentación de Trabajo",
            type=ActivityType.SESSION,
            status=ActivityStatus.SCHEDULED,
            startTime=start_dt,
            endTime=end_dt,
            block_id=payload.block_id,
            location_id=payload.location_id,
            external_paper_id=work_id,
            speaker_id=submission.user_id, # Assign speaker from author
            classification_label=work_type_label # Assign work type
        )
        db.add(activity)
    
    db.commit()
    return {"message": "Trabajo programado correctamente"}

@router.post("/exams/{exam_id}/publish")
def publish_exam(exam_id: str):
    """
    Endpoint de prueba para demostrar el Tiempo Real (Hybrid Sync).
    """
    from core.firebase import send_realtime_signal
    
    # 2. Señal de Tiempo Real para los Clientes
    send_realtime_signal(
        collection="event_status", 
        doc_id="current_exam", 
        data={
            "activeExamId": exam_id,
            "status": "OPEN",
            "message": "¡El examen ha comenzado!"
        }
    )
    
    return {"message": f"Examen {exam_id} publicado y señal enviada a Firebase"}

# --- SPEAKER LECTURES ENDPOINTS ---

@router.get("/speakers/{speaker_id}/lectures", response_model=List[SpeakerLectureResponse])
def get_speaker_lectures(speaker_id: str, db: Session = Depends(get_db)):
    """Obtiene todas las ponencias de un ponente específico."""
    return db.query(SpeakerLecture).filter(SpeakerLecture.speaker_id == speaker_id).all()

@router.post("/speakers/{speaker_id}/lectures", response_model=SpeakerLectureResponse)
def create_speaker_lecture(speaker_id: str, lecture: SpeakerLectureCreate, db: Session = Depends(get_db)):
    """Crea una nueva ponencia para un ponente."""
    # Verificar que el ponente existe
    speaker = db.query(User).filter(User.id == speaker_id).first()
    if not speaker:
        raise HTTPException(status_code=404, detail="Ponente no encontrado")
        
    db_lecture = SpeakerLecture(
        speaker_id=speaker_id,
        title=lecture.title,
        specialty=lecture.specialty
    )
    db.add(db_lecture)
    db.commit()
    db.refresh(db_lecture)
    return db_lecture

@router.delete("/lectures/{lecture_id}")
def delete_lecture(lecture_id: int, db: Session = Depends(get_db)):
    """Elimina una ponencia."""
    db_lecture = db.query(SpeakerLecture).filter(SpeakerLecture.id == lecture_id).first()
    if not db_lecture:
        raise HTTPException(status_code=404, detail="Ponencia no encontrada")
    
    db.delete(db_lecture)
    db.commit()
    return {"message": "Ponencia eliminada correctamente"}

# --- SETTINGS ENDPOINTS ---

@router.get("/settings", response_model=List[AcademicSettingResponse])
def get_academic_settings(db: Session = Depends(get_db)):
    """Obtiene todos los ajustes académicos."""
    settings = db.query(AcademicSetting).all()
    # Si no hay settings, crear el default para jurados
    if not any(s.key == "jurados_por_trabajo" for s in settings):
        default_juries = AcademicSetting(key="jurados_por_trabajo", value="3")
        db.add(default_juries)
        db.commit()
        db.refresh(default_juries)
        settings.append(default_juries)
    return settings

@router.put("/settings/{key}", response_model=AcademicSettingResponse)
def update_academic_setting(key: str, setting_data: AcademicSettingBase, db: Session = Depends(get_db)):
    """Actualiza un ajuste académico específico."""
    db_setting = db.query(AcademicSetting).filter(AcademicSetting.key == key).first()
    if not db_setting:
        db_setting = AcademicSetting(key=key, value=setting_data.value)
        db.add(db_setting)
    else:
        db_setting.value = setting_data.value
    
    db.commit()
    db.refresh(db_setting)
    return db_setting
