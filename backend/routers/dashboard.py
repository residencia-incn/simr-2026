from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from oauth2 import get_current_user
import models
from models import User, Meeting, MeetingAttendance, MeetingStatus, AttendanceStatus, FinancialRecord, PaymentStatus, MeetingAgreement, MeetingTask, TaskStatus
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/my-dashboard-summary")
def get_my_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna toda la data crítica para el Widget de Usuario en una sola petición.
    """
    
    # 1. REUNIONES (Activas y Programadas)
    # Buscamos reuniones donde el usuario tiene un registro de asistencia (invitado)
    my_meetings_query = db.query(
        Meeting, 
        MeetingAttendance.status.label("my_status"),
        MeetingAttendance.signed_at.label("signed_at")
    ).join(
        MeetingAttendance, Meeting.id == MeetingAttendance.meeting_id
    ).filter(
        MeetingAttendance.user_id == current_user.id,
        Meeting.status.in_([MeetingStatus.PROGRAMADA, MeetingStatus.EN_CURSO, MeetingStatus.FINALIZADA, MeetingStatus.CERRADA])
    ).order_by(Meeting.scheduled_start.asc()).all()
    
    active_meetings = []
    scheduled_meetings = []

    now = datetime.now()
    
    # --- LAZY AUTO-START LOGIC ---
    # Revisar si hay reuniones programadas que ya debieron iniciar y actualizarlas automáticamente
    # Esto asegura que el frontend de usuario reaccione sin intervención del admin.
    lazy_updates_made = False
    for meeting, _, _ in my_meetings_query:
        if meeting.status == MeetingStatus.PROGRAMADA and meeting.scheduled_start and meeting.scheduled_start <= now:
            meeting.status = MeetingStatus.EN_CURSO
            # Solo establecer real_start_time si no existe (para no sobrescribir si hubo intento previo)
            if not meeting.real_start_time:
                meeting.real_start_time = meeting.scheduled_start 
            lazy_updates_made = True
    
    if lazy_updates_made:
        db.commit()
        # Refrescar la query para obtener estados actualizados
        my_meetings_query = db.query(
            Meeting, 
            MeetingAttendance.status.label("my_status"),
            MeetingAttendance.signed_at.label("signed_at")
        ).join(
            MeetingAttendance, Meeting.id == MeetingAttendance.meeting_id
        ).filter(
            MeetingAttendance.user_id == current_user.id,
            Meeting.status.in_([MeetingStatus.PROGRAMADA, MeetingStatus.EN_CURSO, MeetingStatus.FINALIZADA, MeetingStatus.CERRADA])
        ).order_by(Meeting.scheduled_start.asc()).all()
    # -----------------------------

    for meeting, my_status, signed_at in my_meetings_query:
        # Lógica de Hora de Inicio: Usar la real si ya inició, sino la programada
        # Esto soluciona el caso donde se inicia antes de lo programado
        display_start_time = meeting.real_start_time if meeting.real_start_time else meeting.scheduled_start

        # Estructura de datos para el Frontend
        data = {
            "id": meeting.id,
            "title": meeting.title,
            "start_time": display_start_time.isoformat() if display_start_time else None,
            "status": meeting.status,
            "my_attendance_status": my_status, # PENDIENTE, ESPERANDO, PRESENTE, etc.
            "has_signed": bool(signed_at),
            "real_end_time": meeting.real_end_time.isoformat() if meeting.real_end_time else None,
            "is_preview_active": meeting.is_preview_active
        }
        
        if meeting.status == MeetingStatus.EN_CURSO:
            active_meetings.append(data)
        elif meeting.status in [MeetingStatus.FINALIZADA, MeetingStatus.CERRADA]:
            # Mantener visible por 24 horas después del cierre real
            if meeting.real_end_time:
                time_since_end = now - meeting.real_end_time
                if time_since_end < timedelta(hours=24):
                    active_meetings.append(data)
        else:
            scheduled_meetings.append(data)

    # 2. TAREAS PENDIENTES (Nuevo modelo MeetingTask)
    pending_tasks = db.query(MeetingTask).filter(
        MeetingTask.assigned_to == current_user.id,
        MeetingTask.status != TaskStatus.COMPLETADA
    ).all()

    # 3. DEUDAS PENDIENTES (Multas y otros)
    # 3. DEUDAS PENDIENTES (Sincronizado con Accounting V2)
    # Aportes
    pending_contributions = db.query(models.Contribution).filter(
        models.Contribution.user_id == current_user.id,
        models.Contribution.status.in_([models.ContributionStatus.PENDING, models.ContributionStatus.IN_PROCESS])
    ).all()
    
    # Multas
    pending_penalties = db.query(models.Penalty).filter(
        models.Penalty.user_id == current_user.id,
        models.Penalty.status.in_(["PENDING", "PENDIENTE", "IN_PROCESS", "VALIDANDO"])
    ).all()
    
    month_names = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
        7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }
    
    unified_debts = []
    for c in pending_contributions:
        unified_debts.append({
            "id": c.id,
            "amount": c.amount,
            "concept": f"Aporte {month_names.get(c.month_date.month, '')} {c.month_date.year}",
            "type": "contribution",
            "status": c.status.value if hasattr(c.status, 'value') else c.status,
            "month_date": c.month_date.isoformat() if c.month_date else None
        })

    for p in pending_penalties:
        unified_debts.append({
            "id": p.id,
            "amount": p.amount,
            "concept": p.concept,
            "type": "fine",
            "status": p.status
        })

    # Totalizador de notificaciones (Rojo)
    meetings_to_mark = len([m for m in active_meetings if m['my_attendance_status'] == AttendanceStatus.PENDIENTE])
    badge_count = meetings_to_mark + len(pending_tasks) + len(unified_debts)

    # 4. ENCUESTAS (Activas o Cerradas hace < 24h)
    # Ya tenemos active_meetings que filtra por 24h
    active_meeting_ids = [m['id'] for m in active_meetings]
    processed_polls = []
    
    if active_meeting_ids:
        polls_query = db.query(models.Poll).filter(
            models.Poll.meeting_id.in_(active_meeting_ids),
            models.Poll.status.in_([models.PollStatus.ACTIVE, models.PollStatus.CLOSED])
        ).all()
        
        for p in polls_query:
            my_vote = db.query(models.PollVote).filter(
                models.PollVote.poll_id == p.id,
                models.PollVote.user_id == current_user.id
            ).first()
            
            # Solo sumar al badge si está activa y NO ha votado
            if p.status == models.PollStatus.ACTIVE and not my_vote:
                badge_count += 1
                
            processed_polls.append({
                "id": p.id,
                "title": p.title,
                "status": p.status,
                "my_vote_option_id": my_vote.option_id if my_vote else None,
                "meeting_id": p.meeting_id,
                "poll_type": p.poll_type
            })

    return {
        "badge_count": badge_count,
        "meetings": {
            "active": active_meetings,
            "scheduled": scheduled_meetings
        },
        "tasks": [
            {
                "id": t.id, 
                "title": t.title,
                "description": t.description,
                "deadline": t.deadline.isoformat() if t.deadline else None,
                "priority": t.priority,
                "progress": t.progress,
                "status": t.status,
                "meeting_title": t.meeting.title if t.meeting else "Sin reunión",
                "comments": t.comments
            } for t in pending_tasks
        ],
        "debts": unified_debts,
        "polls": processed_polls
    }
