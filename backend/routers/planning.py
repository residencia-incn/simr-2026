
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import hashlib

from database import get_db
from models import (
    Meeting, MeetingAgreement, MeetingAttendance, FinancialRecord, MeetingTask, User,
    MeetingStatus, AttendanceStatus, TransactionType, PaymentStatus, TaskPriority, TaskStatus,
    Poll, PollOption, PollVote, Penalty
)
from schemas.planning import (
    MeetingCreate, MeetingUpdate, MeetingOut,
    AgreementCreate, AgreementOut,
    AttendanceBase, AttendanceOut, JustificationSchema,
    TaskCreate, TaskUpdate, TaskOut, TaskProgressUpdate,
    FinancialRecordOut
)
import oauth2 # Assuming oauth2 handles authentication
import auth
from pydantic import BaseModel
from services import meeting_service, pdf_service
from fastapi.encoders import jsonable_encoder

router = APIRouter(prefix="/planning", tags=["Planificación"])

# --- REUNIONES ---

@router.get("/meetings", response_model=List[MeetingOut])
def get_meetings(db: Session = Depends(get_db)):
    return db.query(Meeting).order_by(Meeting.scheduled_start.desc()).all()

@router.get("/meetings/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).options(
        joinedload(Meeting.attendances).joinedload(MeetingAttendance.user),
        joinedload(Meeting.agreements),
        joinedload(Meeting.tasks),
        joinedload(Meeting.polls)
    ).get(meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")
    
    # [NEW] Enrich with Penalty Status for UI Logic
    try:
        clean_title = meeting.title.strip()
        penalties = db.query(Penalty).filter(
            Penalty.concept.ilike(f"%{clean_title}%")
        ).all()
        
        print(f"DEBUG: Found {len(penalties)} penalties for meeting '{clean_title}'")
        
        # Create a map: user_id -> status (Priority: PAID > PENDING > ANULADO)
        p_map = {}
        for p in penalties:
            # Normalize status to uppercase for comparison
            p_status = p.status.upper() if p.status else "PENDING"
            
            # If we find a PAID one, it should take precedence for the lock
            if p.user_id not in p_map or p_status == "PAID":
                p_map[p.user_id] = p_status
                print(f"DEBUG: Mapping User {p.user_id} -> {p_status}")
        
        for att in meeting.attendances:
            att.penalty_status = p_map.get(att.user_id)
    except Exception as e:
        print(f"Error enriching meeting with penalty status: {e}")

    return meeting

@router.get("/participant-options")
def get_participant_options(db: Session = Depends(get_db)):
    """
    Retorna los usuarios con rol de organización y los comités con sus integrantes.
    Ideal para el selector de participantes en la creación de reuniones.
    """
    from models import Committee, CommitteeMember
    
    # 1. Usuarios de Organización
    # Buscamos usuarios que tengan 'organizador'/'organizacion' en Roles (JSON) o EventRole
    # Usamos un query más robusto para evitar problemas con operadores JSON/JSONB
    all_users = db.query(User).filter(User.status != "Inactivo").all()
    org_users = []
    for u in all_users:
        is_org = False
        # Verificar eventRole
        if u.eventRole in ["organizador", "organizacion", "Organización"]:
            is_org = True
        # Verificar roles (JSON list)
        elif u.roles and isinstance(u.roles, list):
            if any(r in ["organizador", "organizacion", "Organización"] for r in u.roles):
                is_org = True
        # Verificar SuperAdmin
        elif u.isSuperAdmin:
            is_org = True
            
        if is_org:
            org_users.append(u)
    
    # Mapear IDs de usuario a nombres de comités
    user_to_committee = {
        m.user_id: m.committee.name for m in db.query(CommitteeMember).options(joinedload(CommitteeMember.committee)).all()
    }
    
    users_list = [{
        "id": u.id,
        "name": f"{u.firstName or ''} {u.lastName or ''}".strip() or u.name,
        "dni": u.dni,
        "committee_name": user_to_committee.get(u.id, "Sin Comisión")
    } for u in org_users]
    
    # 2. Comités y sus integrantes
    committees = db.query(Committee).all()
    committees_list = []
    for c in committees:
        member_ids = [m.user_id for m in c.members]
        committees_list.append({
            "id": c.id,
            "name": c.name,
            "member_ids": member_ids
        })
        
    return {
        "users": users_list,
        "committees": committees_list
    }

@router.post("/meetings", response_model=MeetingOut)
def create_meeting(
    payload: MeetingCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    # 1. Crear la reunión
    new_meeting = Meeting(
        title=payload.title,
        scheduled_start=payload.scheduled_start,
        created_by=current_user.id
    )
    db.add(new_meeting)
    db.flush() 
    
    # 2. VALIDACIÓN DE SEGURIDAD: Solo permitir organizadores
    invited_ids = payload.invited_user_ids
    if invited_ids:
        # Filtrar usuarios que realmente son organizadores o superadmins
        # Usamos una búsqueda en memoria para compatibilidad total con el tipo JSON de Postgres
        potential_users = db.query(User).filter(User.id.in_(invited_ids)).all()
        valid_ids = []
        for u in potential_users:
            if (u.eventRole in ["organizador", "organizacion", "Organización"]) or \
               (u.roles and isinstance(u.roles, list) and any(r in ["organizador", "organizacion", "Organización"] for r in u.roles)) or \
               (u.isSuperAdmin):
                valid_ids.append(u.id)
        
        # 3. Crear registros de asistencia PENDIENTES solo para los validados
        for uid in valid_ids:
            attendance = MeetingAttendance(
                meeting_id=new_meeting.id,
                user_id=uid,
                status=AttendanceStatus.PENDIENTE
            )
            db.add(attendance)
            
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

@router.put("/meetings/{meeting_id}", response_model=MeetingOut)
async def update_meeting(meeting_id: int, payload: MeetingUpdate, db: Session = Depends(get_db)):
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(status_code=404, detail="Reunión no encontrada")

        # 1. Actualizar campos simples
        if payload.title is not None:
            meeting.title = payload.title
        if payload.scheduled_start is not None:
            meeting.scheduled_start = payload.scheduled_start
        if payload.status is not None:
            meeting.status = payload.status
        if payload.is_preview_active is not None:
            meeting.is_preview_active = payload.is_preview_active
            # 🔥 WebSocket Broadcast
            from socket_manager import manager
            await manager.broadcast_to_meeting(meeting_id, {
                "type": "MEETING_UPDATED",
                "meeting_id": meeting_id,
                "is_preview_active": meeting.is_preview_active
            })

        if payload.next_meeting_agenda is not None:
            meeting.next_meeting_agenda = payload.next_meeting_agenda
            
        if payload.next_meeting_id is not None:
            meeting.next_meeting_id = payload.next_meeting_id

        # 2. LIMPIEZA TOTAL (Borrar y Reinsertar)
        agreements_data = payload.agreements
        
        # Desvinculación de seguridad
        try:
            from sqlalchemy import text
            db.execute(text("UPDATE meeting_agreements SET parent_id = NULL WHERE meeting_id = :mid"), {"mid": meeting_id})
            db.flush()
        except: pass
        
        # Borrar antiguos
        db.query(MeetingAgreement).filter(MeetingAgreement.meeting_id == meeting_id).delete(synchronize_session=False)
        db.flush()

        # 3. Insertar nuevo árbol
        def recursive_save(nodes, parent_id=None):
            if not nodes: return

            for node in nodes:
                assigned_uid = node.assigned_user_id
                if assigned_uid == "": assigned_uid = None
                
                new_agreement = MeetingAgreement(
                    meeting_id=meeting_id,
                    parent_id=parent_id,
                    content=node.content,
                    is_completed=node.is_completed,
                    level=node.level,
                    assigned_user_id=assigned_uid,
                    deadline=node.deadline
                )
                db.add(new_agreement)
                db.flush()
                
                if node.children:
                    recursive_save(node.children, parent_id=new_agreement.id)

        if agreements_data:
            recursive_save(agreements_data)

        # 4. GUARDAR CAMBIOS
        db.commit()
        
        # 5. RECARGAR DATOS PARA RESPONDER
        db.refresh(meeting) 
        
        return meeting 

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.delete("/meetings/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    """
    Elimina una reunión SOLO si está en estado PROGRAMADA.
    Reuniones iniciadas o finalizadas no pueden eliminarse (auditoría).
    """
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")
    
    # 🚨 VALIDACIÓN DE SEGURIDAD: Solo reuniones programadas pueden eliminarse
    if meeting.status != MeetingStatus.PROGRAMADA:
        raise HTTPException(
            status_code=403, 
            detail=f"No se puede eliminar una reunión en estado {meeting.status.value}. Solo reuniones PROGRAMADAS pueden eliminarse."
        )
    
    db.delete(meeting)
    db.commit()
    return {"message": "Reunión eliminada exitosamente", "id": meeting_id}

@router.post("/meetings/{meeting_id}/start", response_model=MeetingOut)
def start_meeting(
    meeting_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")
    
    meeting.status = MeetingStatus.EN_CURSO
    meeting.real_start_time = datetime.now()
    db.commit()
    db.refresh(meeting)
    return meeting

# --- ASISTENCIA (ANTI-FRAUDE) ---

@router.post("/meetings/{meeting_id}/check-in", response_model=AttendanceOut)
def check_in(
    meeting_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
         raise HTTPException(status_code=404, detail="Reunión no encontrada")
    
    if meeting.status != MeetingStatus.EN_CURSO:
        raise HTTPException(status_code=400, detail="La reunión no está activa para marcar asistencia.")

    # Validar si ya marcó
    attendance = db.query(MeetingAttendance).filter_by(
        meeting_id=meeting_id, user_id=current_user.id
    ).first()
    
    if attendance and attendance.check_in_time:
         raise HTTPException(status_code=400, detail="Ya has registrado tu asistencia")

    now = datetime.now()
    
    # Lógica de Auditoría: Comparar con el inicio REAL de la reunión
    # Si no hay real_start_time, usamos el scheduled_start como fallback
    base_time = meeting.real_start_time or meeting.scheduled_start
    delta = now - base_time
    minutes_late = delta.total_seconds() / 60
    
    if not attendance:
        attendance = MeetingAttendance(meeting_id=meeting_id, user_id=current_user.id)
        db.add(attendance)
    
    attendance.check_in_time = now
    
    # REGLA: 10 Minutos de Tolerancia
    if minutes_late <= 10:
        attendance.status = AttendanceStatus.PRESENTE
    else:
        attendance.status = AttendanceStatus.TARDANZA
        # INTEGRACIÓN FINANCIERA AUTOMÁTICA (S/ 10.00) - V2 USES PENALTY TABLE
        new_penalty = Penalty(
            user_id=current_user.id,
            amount=10.00,
            concept=f"Tardanza: {meeting.title}",
            status="PENDING"
        )
        db.add(new_penalty)

    db.commit()
    db.refresh(attendance)
    # attendance.user_name property will be used by Pydantic response model

    return attendance

# --- FIRMA DIGITAL (NO REPUDIO) ---

@router.post("/meetings/{meeting_id}/sign", response_model=AttendanceOut)
async def sign_meeting(
    meeting_id: int, 
    payload: dict, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    password = payload.get("password")
    if not password:
        raise HTTPException(status_code=400, detail="Contraseña requerida para firmar.")
    
    if not auth.verify_password(password, current_user.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta. No se puede firmar el acta.")

    meeting = db.query(Meeting).get(meeting_id)
    attendance = db.query(MeetingAttendance).filter_by(
        meeting_id=meeting_id, user_id=current_user.id
    ).first()

    if not meeting or meeting.status != MeetingStatus.FINALIZADA:
        raise HTTPException(status_code=400, detail="El acta aún no está abierta para firmas.")

    # --- LÓGICA CRÍTICA DEL TEMPORIZADOR (15 MIN) ---
    now = datetime.now()
    deadline = meeting.real_end_time + timedelta(minutes=15)
    
    if now > deadline:
        raise HTTPException(
            status_code=403, 
            detail="La ventana de firma (15 min) ha expirado. Si aún no firmó, se registrará como FALTA."
        )

    if attendance.signed_at:
        raise HTTPException(status_code=400, detail="Ya has firmado esta acta.")

    # Generar Hash de Firma (Cadena de Custodia)
    signature_base = f"{current_user.id}:{meeting_id}:{meeting.real_end_time.isoformat()}:{now.isoformat()}"
    signature_hash = hashlib.sha256(signature_base.encode()).hexdigest()
    
    attendance.signed_at = now
    attendance.signature_hash = signature_hash
    
    db.commit()
    db.refresh(attendance)
    # attendance.user_name property handles name resolution automatically

    # 🔥 WebSocket Broadcast
    from socket_manager import manager
    await manager.broadcast_to_meeting(meeting_id, {
        "type": "MEETING_UPDATED",
        "meeting_id": meeting_id,
        "signature_update": True, # Signal to re-fetch or update attendance
        "attendances": [
            {
                "user_id": attendance.user_id,
                "signed_at": attendance.signed_at.isoformat() if attendance.signed_at else None,
                "signature_hash": attendance.signature_hash
            }
        ]
    })

    return attendance

# --- CIERRE Y MULTAS POR FALTA ---

@router.post("/meetings/{meeting_id}/terminate", response_model=MeetingOut)
def terminate_meeting(
    meeting_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    """Primer paso: Terminar la sesión y abrir ventana de 15 min para firmas."""
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")
    
    meeting.status = MeetingStatus.FINALIZADA
    meeting.real_end_time = datetime.now()
    db.commit()
    db.refresh(meeting)
    return meeting

@router.post("/meetings/{meeting_id}/close-act", response_model=MeetingOut)
def close_act(
    meeting_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    """Segundo paso (Secretaria): Cierre definitivo y barrido de faltas/multas."""
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")
    
    # 1. Barre todos los organizadores
    organizadores = db.query(User).filter(User.eventRole == 'organizador').all()
    
    for org in organizadores:
        attendance = db.query(MeetingAttendance).filter_by(
            meeting_id=meeting_id, user_id=org.id
        ).first()

        create_fine = False
        description = ""

        # CASO 1: Nunca vino (Sin check-in)
        if not attendance:
            attendance = MeetingAttendance(
                meeting_id=meeting_id, user_id=org.id, status=AttendanceStatus.FALTA
            )
            db.add(attendance)
            create_fine = True
            description = f"Falta Injustificada: {meeting.title}"
        
        # CASO 2: Vino pero NO firmó y NO está justificado
        elif not attendance.signed_at and not attendance.is_justified:
            attendance.status = AttendanceStatus.FALTA
            create_fine = True
            description = f"Asistencia sin firma de acta: {meeting.title}"

        if create_fine:
            # INTEGRACIÓN FINANCIERA AUTOMÁTICA (S/ 20.00) - V2 USES PENALTY TABLE
            penalty = Penalty(
                user_id=org.id,
                amount=20.00,
                concept=description.replace("Multa ", ""), # Description might still contain it from local var
                status="PENDING"
            )
            db.add(penalty)

    meeting.status = MeetingStatus.CERRADA
    db.commit()
    db.refresh(meeting)
    return meeting

# --- ACUERDOS (RECURSIVOS) ---

@router.post("/meetings/{meeting_id}/agreements", response_model=AgreementOut)
def create_agreement(
    meeting_id: int, 
    payload: AgreementCreate, 
    db: Session = Depends(get_db)
):
    agreement = MeetingAgreement(
        meeting_id=meeting_id,
        content=payload.content,
        level=payload.level,
        parent_id=payload.parent_id
    )
    db.add(agreement)
    db.commit()
    db.refresh(agreement)
    return agreement

# --- TAREAS ---

@router.get("/tasks", response_model=List[TaskOut])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    # Retorna tareas asignadas al usuario o creadas por él
    return db.query(MeetingTask).filter(
        (MeetingTask.assigned_to == current_user.id) | (MeetingTask.assigned_by == current_user.id)
    ).all()

@router.post("/tasks", response_model=TaskOut)
def create_task(
    payload: TaskCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    task = MeetingTask(
        **payload.model_dump(),
        assigned_by=current_user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.patch("/tasks/{task_id}/progress")
def update_task_progress(
    task_id: int,
    payload: TaskProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    task = db.query(MeetingTask).filter(MeetingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    # Solo el responsable puede actualizar su progreso
    if task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para actualizar esta tarea")

    task.progress = payload.progress
    task.status = payload.status
    
    # Agregar nota automática o personalizada al historial
    comment_text = payload.comment if payload.comment else f"Progreso actualizado a {payload.progress}% - Estado: {payload.status.value}"
    
    comment = {
        "timestamp": datetime.now().isoformat(),
        "progress": payload.progress,
        "text": comment_text,
        "user_id": current_user.id
    }
    
    # Actualizar JSON de comentarios
    new_comments = list(task.comments) if task.comments else []
    new_comments.append(comment)
    task.comments = new_comments
    
    db.commit()
    return {"message": "Avance registrado", "task_id": task_id}

@router.put("/tasks/{task_id}", response_model=TaskOut)
def update_task_full(
    task_id: int, 
    payload: TaskUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    task = db.query(MeetingTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    data = payload.model_dump(exclude_unset=True)
    comment_text = data.pop("comment", None)
    
    for key, value in data.items():
        setattr(task, key, value)
    
    if comment_text:
        comment = {
            "timestamp": datetime.now().isoformat(),
            "progress": task.progress,
            "text": comment_text,
            "user_id": current_user.id
        }
        new_comments = list(task.comments) if task.comments else []
        new_comments.append(comment)
        task.comments = new_comments

    db.commit()
    db.refresh(task)
    return task

# --- NUEVOS ENDPOINTS DE ASISTENCIA (Gestión de Confianza) ---

class JustificationSchema(BaseModel):
    reason: str

@router.post("/meetings/{meeting_id}/mark-attendance", response_model=AttendanceOut)
async def mark_attendance_endpoint(
    meeting_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    attendance = meeting_service.mark_attendance_immediate(db, meeting_id, current_user.id)
    
    # WebSocket Broadcast
    from socket_manager import manager
    await manager.broadcast_to_meeting(meeting_id, {
        "type": "MEETING_UPDATED",
        "meeting_id": meeting_id,
        "attendances": [jsonable_encoder(AttendanceOut.model_validate(attendance))]
    })
    
    return attendance

@router.put("/meetings/{meeting_id}/participants/{user_id}/reject", response_model=AttendanceOut)
async def reject_participant_endpoint(
    meeting_id: int, 
    user_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    # TO DO: Validate role if strict needed
    attendance = meeting_service.reject_attendance(db, meeting_id, user_id, current_user.id)
    
    # WebSocket Broadcast
    from socket_manager import manager
    await manager.broadcast_to_meeting(meeting_id, {
        "type": "MEETING_UPDATED",
        "meeting_id": meeting_id,
        "attendances": [jsonable_encoder(AttendanceOut.model_validate(attendance))]
    })
    
    return attendance

@router.put("/meetings/{meeting_id}/participants/{user_id}/justify", response_model=AttendanceOut)
async def justify_participant_endpoint(
    meeting_id: int, 
    user_id: str, 
    payload: JustificationSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user)
):
    attendance = meeting_service.justify_attendance(db, meeting_id, user_id, payload.reason, current_user.id)
    
    # WebSocket Broadcast
    from socket_manager import manager
    await manager.broadcast_to_meeting(meeting_id, {
        "type": "MEETING_UPDATED",
        "meeting_id": meeting_id,
        "attendances": [jsonable_encoder(AttendanceOut.model_validate(attendance))]
    })
    
    return attendance

@router.get("/meetings/{meeting_id}/pdf")
def get_meeting_pdf(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).options(
        joinedload(Meeting.agreements),
        joinedload(Meeting.attendances).joinedload(MeetingAttendance.user),
        joinedload(Meeting.tasks).joinedload(MeetingTask.assignee),
        joinedload(Meeting.polls).joinedload(Poll.options).joinedload(PollOption.votes)
    ).get(meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunión no encontrada")
        
    # [NEW] Fetch Next Meeting details for PDF
    next_meeting = None
    if meeting.next_meeting_id:
        next_meeting = db.query(Meeting).get(meeting.next_meeting_id)
        
    pdf_buffer = pdf_service.generate_meeting_minutes_pdf(
        meeting, 
        meeting.attendances, 
        meeting.agreements, 
        meeting.tasks, 
        meeting.polls,
        next_meeting
    )
    
    # Filename safe string
    title_slug = "".join([c for c in meeting.title if c.isalnum() or c in (' ', '-', '_')]).strip().replace(' ', '_')
    filename = f"Acta_{title_slug}_{meeting.scheduled_start.date()}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
