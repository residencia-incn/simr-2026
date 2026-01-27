from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime as dt
import pytz # Assuming installed, otherwise fallback to datetime.timezone.utc

from database import get_db
from dependencies import get_current_user # Ensure this dependency exists in dependencies.py or oauth2.py
from models_research import SubmissionType, SubmissionSectionConfig, Submission, SubmissionValue, SubmissionFeedback, ResearchAudit
from schemas.research import (
    SubmissionTypeCreate, SubmissionTypeResponse, SubmissionTypeUpdate,
    SubmissionCreateSchema, SubmissionResponse, SubmissionStatusUpdate
)
from models_research import SubmissionType, SubmissionSectionConfig, Submission, SubmissionValue, SubmissionFeedback, ResearchAudit, ResearchFile
from schemas.research import (
    SubmissionTypeCreate, SubmissionTypeResponse, SubmissionTypeUpdate,
    SubmissionCreateSchema, SubmissionResponse, SubmissionStatusUpdate
)
from models import ProgramActivity
from services import files as file_service
from fastapi import UploadFile, File, Form

router = APIRouter()

@router.post("/config/types", response_model=SubmissionTypeResponse)
def create_submission_type(
    config_in: SubmissionTypeCreate,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # Uncomment when auth is fully rigorous or strictly enforced
):
    # 1. Business Logic Validation
    if config_in.deadline_extended and config_in.deadline_extended < config_in.deadline_standard:
        raise HTTPException(
            status_code=400, 
            detail="La fecha de prórroga no puede ser anterior a la fecha límite normal."
        )

    # 2. Check duplicates
    existing = db.query(SubmissionType).filter(SubmissionType.name == config_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un tipo de trabajo con este nombre.")

    # 3. Create Type (Parent)
    db_obj = SubmissionType(
        name=config_in.name,
        description=config_in.description,
        deadline_standard=config_in.deadline_standard,
        deadline_extended=config_in.deadline_extended,
        penalty_per_day=config_in.penalty_per_day,
        is_active=config_in.is_active,
        checklist_config=config_in.checklist_config
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # 4. Create Sections (Children)
    for sec in config_in.sections:
        db_section = SubmissionSectionConfig(
            submission_type_id=db_obj.id,
            title=sec.title,
            help_text=sec.help_text,
            section_order=sec.section_order,
            data_type=sec.data_type,
            min_words=sec.min_words,
            max_words=sec.max_words,
            allowed_file_types=sec.allowed_file_types,
            is_required=sec.is_required
        )
        db.add(db_section)
    
    db.commit()
    db.refresh(db_obj) # Accessing relationships usually requires a refresh or eager load
    return db_obj

@router.get("/config/types", response_model=List[SubmissionTypeResponse])
def read_submission_types(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)
):
    types = db.query(SubmissionType).offset(skip).limit(limit).all()
    return types

@router.put("/config/types/{type_id}", response_model=SubmissionTypeResponse)
def update_submission_type(
    type_id: int,
    config_in: SubmissionTypeUpdate,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)
):
    # 1. Fetch Existing
    db_obj = db.query(SubmissionType).filter(SubmissionType.id == type_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Tipo de trabajo no encontrado.")

    # 2. Business Logic Validation
    if config_in.deadline_extended and config_in.deadline_extended < config_in.deadline_standard:
        raise HTTPException(
            status_code=400, 
            detail="La fecha de prórroga no puede ser anterior a la fecha límite normal."
        )

    # 3. Check for duplicates (if name changed)
    if config_in.name != db_obj.name:
        existing = db.query(SubmissionType).filter(SubmissionType.name == config_in.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un tipo de trabajo con este nombre.")

    # 4. Update Parent
    db_obj.name = config_in.name
    db_obj.description = config_in.description
    db_obj.deadline_standard = config_in.deadline_standard
    db_obj.deadline_extended = config_in.deadline_extended
    db_obj.penalty_per_day = config_in.penalty_per_day
    db_obj.is_active = config_in.is_active
    db_obj.checklist_config = config_in.checklist_config
    
    # 5. Handle Sections (Smart Update)
    # Check if section configuration actually changed to avoid unnecessary deletes (which cause FK errors with existing submissions)
    
    # Helper to serialize section for comparison
    def serialize_section(s):
        return {
            "title": s.title,
            "help_text": s.help_text,
            "section_order": s.section_order,
            "data_type": s.data_type,
            "min_words": s.min_words,
            "max_words": s.max_words,
            "allowed_file_types": s.allowed_file_types,
            "is_required": s.is_required
        }

    current_sections = sorted([serialize_section(s) for s in db_obj.sections], key=lambda x: x['section_order'])
    new_sections = sorted([serialize_section(s) for s in config_in.sections], key=lambda x: x['section_order'])

    if current_sections != new_sections:
        # Sections changed, attempt to replace
        # This might fail if submissions exist (IntegrityError), but we only risk it if changes were actually requested
        db.query(SubmissionSectionConfig).filter(SubmissionSectionConfig.submission_type_id == db_obj.id).delete()
        
        for sec in config_in.sections:
            db_section = SubmissionSectionConfig(
                submission_type_id=db_obj.id,
                title=sec.title,
                help_text=sec.help_text,
                section_order=sec.section_order,
                data_type=sec.data_type,
                min_words=sec.min_words,
                max_words=sec.max_words,
                allowed_file_types=sec.allowed_file_types,
                is_required=sec.is_required
            )
            db.add(db_section)

    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- SUBMISSIONS ---

def generate_submission_id(db: Session):
    """Genera un ID humano legible como TRB-0001."""
    # Intentamos obtener el último ID para seguir la secuencia
    last = db.query(Submission).order_by(Submission.id.desc()).first()
    if not last or not last.id.startswith('TRB-'):
        return "TRB-0001"
    
    try:
        # Extraemos el número después del guión
        last_num = int(last.id.split('-')[1])
        return f"TRB-{str(last_num + 1).zfill(4)}"
    except (IndexError, ValueError):
        # Fallback si el formato no es el esperado
        count = db.query(Submission).count()
        return f"TRB-{str(count + 1).zfill(4)}"

def enrich_submission(s: Submission, db: Session):
    if s.submission_type:
        s.type_name = s.submission_type.name
        s.checklist_config = s.submission_type.checklist_config
    if s.user:
        s.author_name = s.user.name
    
    # Populate section titles for values
    if s.values:
        for val in s.values:
            if val.section_config:
                val.section_title = val.section_config.title

    # --- INJECT SCHEDULE DATA ---
    # Find if this paper is scheduled in the program
    if db:
        activity = db.query(ProgramActivity).filter(ProgramActivity.external_paper_id == s.id).first()
        if activity:
            s.schedule_info = {
                "start_time": activity.startTime,
                "end_time": activity.endTime,
                "location": activity.location.name if activity.location else "Por definir"
            }
        else:
            s.schedule_info = None

        # --- INJECT FILE STATUS (SLIDES) ---
        last_file = db.query(ResearchFile).filter(
            ResearchFile.submission_id == s.id,
            ResearchFile.file_type == 'SLIDES'
        ).order_by(ResearchFile.version.desc()).first()
        
        if last_file:
            print(f"DEBUG: Found last_file for {s.id}: {last_file.id} ({last_file.status})")
            s.latest_slide = {
                "id": last_file.id,
                "version": last_file.version,
                "status": last_file.status,
                "admin_comment": last_file.admin_comment,
                "file_path": last_file.file_path,
                "original_filename": last_file.original_filename
            }
        else:
            print(f"DEBUG: No last_file found for {s.id}")
            s.latest_slide = None
            
    return s

@router.get("/submissions/me", response_model=List[SubmissionResponse])
def read_my_submissions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retorna los trabajos enviados por el usuario actual."""
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    # Pydantic via ORM mode will pick up authorized fields if defined in Schema, but dynamic fields need explicit attachment if not in ORM model
    # For simplicity, we attach to instance and assume Schema has 'schedule_info' or allows extra
    return [enrich_submission(s, db) for s in submissions]

@router.get("/submissions", response_model=List[SubmissionResponse])
def read_all_submissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # Add role check later
):
    """Retorna todos los trabajos (para administradores)."""
    submissions = db.query(Submission).offset(skip).limit(limit).all()
    return [enrich_submission(s, db) for s in submissions]

@router.patch("/submissions/{submission_id}/status", response_model=SubmissionResponse)
def update_submission_status(
    submission_id: str,
    update_data: SubmissionStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) # Add role check
):
    """Actualiza el estado y feedback de un trabajo."""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    old_status = submission.status
    submission.status = update_data.status
    
    # Audit Status Change
    if old_status != update_data.status:
        audit_log = ResearchAudit(
            submission_id=submission_id,
            user_id=current_user.id,
            action="STATUS_CHANGE",
            details=f"Estado cambiado de {old_status} a {update_data.status}",
            previous_value={"status": old_status},
            new_value={"status": update_data.status}
        )
        db.add(audit_log)

    if update_data.checklist is not None:
        submission.checklist = update_data.checklist
        
    full_feedback = update_data.feedback or ""
    
    if update_data.specific_feedback and len(update_data.specific_feedback) > 0:
        # Append specific feedback to the general comment
        full_feedback += "\n\n--- OBSERVACIONES ESPECÍFICAS ---\n"
        for item in update_data.specific_feedback:
            section = item.get("section", "Sección General")
            comment = item.get("comment", "")
            full_feedback += f"• [{section}]: {comment}\n"

    if full_feedback.strip():
        # Create a feedback entry
        feedback_entry = SubmissionFeedback(
            submission_id=submission_id,
            reviewer_id=current_user.id,
            comment=full_feedback.strip()
        )
        db.add(feedback_entry)
        
        # Audit Feedback
        audit_feedback = ResearchAudit(
            submission_id=submission_id,
            user_id=current_user.id,
            action="FEEDBACK_ADDED",
            details="Se agregaron nuevas observaciones",
            new_value={"comment": full_feedback.strip()}
        )
        db.add(audit_feedback)
    
    db.commit()
    db.refresh(submission)
    return enrich_submission(submission, db)

@router.post("/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(
    submission_in: SubmissionCreateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Get Submission Type
    submission_type = db.query(SubmissionType).filter(SubmissionType.id == submission_in.type_id).first()
    if not submission_type:
        raise HTTPException(status_code=404, detail="Tipo de trabajo no encontrado")
        
    if not submission_type.is_active:
         raise HTTPException(status_code=400, detail="Este tipo de envío ya no está activo")

    # 2. Date Validation (Deadline & Extension)
    # Using America/Lima as per user context
    try:
        peru_tz = pytz.timezone('America/Lima')
    except:
        peru_tz = pytz.UTC # Fallback if pytz/zoneinfo issue
        
    now = dt.datetime.now(peru_tz)
    
    # Ensure deadlines are aware
    deadline_std = submission_type.deadline_standard
    if deadline_std.tzinfo is None:
        deadline_std = pytz.utc.localize(deadline_std).astimezone(peru_tz)
    else:
        deadline_std = deadline_std.astimezone(peru_tz)
        
    deadline_ext = submission_type.deadline_extended
    if deadline_ext:
        if deadline_ext.tzinfo is None:
            deadline_ext = pytz.utc.localize(deadline_ext).astimezone(peru_tz)
        else:
            deadline_ext = deadline_ext.astimezone(peru_tz)

    is_late = False
    
    # Check Deadlines
    final_limit = deadline_ext if deadline_ext else deadline_std
    
    if now > final_limit:
        raise HTTPException(
            status_code=400, 
            detail="El plazo de envío ha finalizado definitivamente."
        )
        
    if now > deadline_std:
        is_late = True
        
    # 3. Content Validation
    validated_values = []
    
    for val in submission_in.values:
        section_config = db.query(SubmissionSectionConfig).filter(SubmissionSectionConfig.id == val.section_config_id).first()
        
        if not section_config:
            continue
            
        # Required Check
        if section_config.is_required:
            is_empty = False
            if section_config.data_type == 'TEXT':
                if not val.content_text or not val.content_text.strip(): is_empty = True
            elif section_config.data_type == 'FILE':
                if not val.file_url: is_empty = True
            elif section_config.data_type == 'BOOLEAN':
                if val.bool_value is not True: is_empty = True # Checkbox must be true if required (e.g. declarations)
            
            if is_empty:
                raise HTTPException(status_code=400, detail=f"La sección '{section_config.title}' es obligatoria.")

        # Word Count Check
        if section_config.data_type == 'TEXT' and val.content_text:
            word_count = len(val.content_text.strip().split())
            if section_config.max_words and word_count > section_config.max_words:
                raise HTTPException(
                    status_code=400, 
                    detail=f"La sección '{section_config.title}' excede el límite de {section_config.max_words} palabras."
                )

        validated_values.append(val)

    # 4. Extract Title and Auto-generate ID
    submission_title = submission_in.title
    
    # If no title was sent globally, try to find it in the values
    if not submission_title:
        for val in validated_values:
            section_config = db.query(SubmissionSectionConfig).filter(SubmissionSectionConfig.id == val.section_config_id).first()
            if section_config and ("titulo" in section_config.title.lower() or "título" in section_config.title.lower()):
                submission_title = val.content_text
                break
    
    custom_id = generate_submission_id(db)

    # 5. Atomic Transaction
    try:
        new_submission = Submission(
            id=custom_id,
            user_id=current_user.id,
            type_id=submission_type.id,
            title=submission_title,
            specialty=submission_in.specialty,
            status="ENVIADO",
            submitted_at=now,
            is_late_submission=is_late
        )
        db.add(new_submission)
        db.flush()

        for val in validated_values:
            new_value = SubmissionValue(
                submission_id=new_submission.id,
                section_config_id=val.section_config_id,
                content_text=val.content_text,
                file_url=val.file_url,
                bool_value=val.bool_value
            )
            db.add(new_value)

        db.commit()
        
        # Audit Creation
        audit_log = ResearchAudit(
            submission_id=new_submission.id,
            user_id=current_user.id,
            action="SUBMISSION_CREATED",
            details="Trabajo enviado por primera vez.",
            timestamp=now
        )
        db.add(audit_log)
        db.commit()
        
        db.refresh(new_submission)
        return enrich_submission(new_submission, db)

    except Exception as e:
        db.rollback()
        error_msg = str(e)
        with open("debug_log.txt", "a") as f:
            import traceback
            # Safe datetime usage
            f.write(f"\n[{dt.datetime.now()}] SUBMISSION ERROR: {error_msg}\n")
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error interno al guardar: {error_msg}")

@router.put("/submissions/{submission_id}", response_model=SubmissionResponse)
def update_submission_content(
    submission_id: str,
    submission_in: SubmissionCreateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza el contenido de un trabajo existente (para subsanar observaciones)."""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
        
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este trabajo")

    if submission.status not in ["borrador", "BORRADOR", "observado", "OBSERVADO"]:
        raise HTTPException(status_code=400, detail="No se puede editar un trabajo en este estado")

    # 1. Date Validation (Deadline & Extension)
    submission_type = submission.submission_type
    try:
        peru_tz = pytz.timezone('America/Lima')
    except:
        peru_tz = pytz.UTC 
        
    now = dt.datetime.now(peru_tz)
    
    deadline_std = submission_type.deadline_standard
    if deadline_std.tzinfo is None:
        deadline_std = pytz.utc.localize(deadline_std).astimezone(peru_tz)
    else:
        deadline_std = deadline_std.astimezone(peru_tz)
        
    deadline_ext = submission_type.deadline_extended
    if deadline_ext:
        if deadline_ext.tzinfo is None:
            deadline_ext = pytz.utc.localize(deadline_ext).astimezone(peru_tz)
        else:
            deadline_ext = deadline_ext.astimezone(peru_tz)

    final_limit = deadline_ext if deadline_ext else deadline_std
    
    if now > final_limit:
        raise HTTPException(
            status_code=400, 
            detail="El plazo de corrección/envío ha finalizado."
        )

    # 2. Update Basic Info
    submission.specialty = submission_in.specialty
    # Determine Title
    submission_title = submission_in.title
    
    # 3. Update Values (Delete old, Insert new strategy for simplicity given atomic transaction)
    # Validate first
    validated_values = []
    
    for val in submission_in.values:
        section_config = db.query(SubmissionSectionConfig).filter(SubmissionSectionConfig.id == val.section_config_id).first()
        if not section_config: continue
            
        # Required Check
        if section_config.is_required:
            is_empty = False
            if section_config.data_type == 'TEXT':
                if not val.content_text or not val.content_text.strip(): is_empty = True
            elif section_config.data_type == 'FILE':
                if not val.file_url: is_empty = True
            elif section_config.data_type == 'BOOLEAN':
                if val.bool_value is not True: is_empty = True
            
            if is_empty:
                raise HTTPException(status_code=400, detail=f"La sección '{section_config.title}' es obligatoria.")

        # Word Count Check
        if section_config.data_type == 'TEXT' and val.content_text:
            word_count = len(val.content_text.strip().split())
            if section_config.max_words and word_count > section_config.max_words:
                raise HTTPException(
                    status_code=400, 
                    detail=f"La sección '{section_config.title}' excede el límite de {section_config.max_words} palabras."
                )

        validated_values.append(val)
        
        # Extract title (Priority: Section Content > Request Title)
        if "titulo" in section_config.title.lower() or "título" in section_config.title.lower():
             if val.content_text:  
                 submission_title = val.content_text

    submission.title = submission_title
    submission.last_updated_at = now
    
    # Audit Content Update
    # For simplicity, we log the event. Ideally we would diff old vs new values.
    audit_log = ResearchAudit(
        submission_id=submission_id,
        user_id=current_user.id,
        action="UPDATE_CONTENT",
        details="El autor actualizó el contenido del trabajo.",
        timestamp=now
    )
    db.add(audit_log)

    # Delete old values
    db.query(SubmissionValue).filter(SubmissionValue.submission_id == submission_id).delete()
    
    # Insert new values
    for val in validated_values:
        new_value = SubmissionValue(
            submission_id=submission_id,
            section_config_id=val.section_config_id,
            content_text=val.content_text,
            file_url=val.file_url,
            bool_value=val.bool_value
        )
        db.add(new_value)
        
    db.commit()
    db.refresh(submission)
    return enrich_submission(submission, db)
# --- File Management Endpoints ---

@router.post("/files/upload")
def upload_research_file(
    submission_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Verify Submission
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
        
    # 2. Check permissions (Author or Admin)
    # TODO: Refine permission check if strictly needed
    
    # 3. Determine Version
    last_file = db.query(ResearchFile).filter(
        ResearchFile.submission_id == submission_id,
        ResearchFile.file_type == 'SLIDES'
    ).order_by(ResearchFile.version.desc()).first()
    
    version = 1
    if last_file:
        version = last_file.version + 1
        
    # 4. Save File
    try:
        saved_path = file_service.save_research_slide(submission_id, file, version)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
        
    # 5. Create DB Entry
    db_file = ResearchFile(
        submission_id=submission_id,
        uploader_id=current_user.id,
        file_type='SLIDES',
        file_path=saved_path,
        original_filename=file.filename,
        version=version,
        status='PENDING'
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return db_file

@router.get("/files/{submission_id}")
def list_research_files(
    submission_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    files = db.query(ResearchFile).filter(ResearchFile.submission_id == submission_id).order_by(ResearchFile.version.desc()).all()
    return files

@router.put("/files/{file_id}/review")
def review_research_file(
    file_id: int,
    status_val: str, # APPROVED, CORRECTION_REQUESTED (renamed param to avoid conflict)
    comment: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    file = db.query(ResearchFile).get(file_id)
    if not file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
        
    file.status = status_val
    file.admin_comment = comment
    db.commit()
    return file
