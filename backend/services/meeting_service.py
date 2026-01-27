from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models import Meeting, MeetingAttendance, MeetingStatus, AttendanceStatus
from services import finance_service 

# Constantes
TOLERANCIA_MINUTOS = 10
VENTANA_JUSTIFICACION_HORAS = 24

def mark_attendance_immediate(db: Session, meeting_id: int, user_id: str):
    """
    El usuario marca y se calcula INSTANTÁNEAMENTE su estado (Presente/Tarde).
    """
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(404, "Reunión no encontrada.")
        
    # Validamos status. Si está PROGRAMADA pero no iniciada, ¿permitimos marcar?
    # Usualmente no, hasta que sea EN_CURSO.
    if meeting.status != MeetingStatus.EN_CURSO:
        raise HTTPException(400, "La reunión no está en curso.")

    attendance = db.query(MeetingAttendance).filter_by(meeting_id=meeting_id, user_id=user_id).first()
    if not attendance:
        raise HTTPException(403, "No estás invitado a esta reunión.")

    # Si ya marcó, no hacer nada (idempotencia), a menos que fuera rechazado y quiera marcar de nuevo?
    # Si fue RECHAZADO (FALTA), ¿puede marcar de nuevo?
    # Asumimos que si está "PENDIENTE" o "FALTA" (si se rectifica en el momento) puede marcar.
    # Pero el snippet dice: "Si ya marcó... return attendance".
    # Si su status es PRESENTE o TARDANZA, ya marcó.
    if attendance.status in [AttendanceStatus.PRESENTE, AttendanceStatus.TARDANZA] and attendance.check_in_time:
        return attendance

    # Lógica de Tiempo
    now = datetime.now()
    attendance.check_in_time = now
    
    # Calcular delta desde el inicio REAL
    start_time = meeting.real_start_time or meeting.scheduled_start
    if not start_time:
        start_time = now # Fallback safe check
        
    delta = now - start_time
    minutes_late = delta.total_seconds() / 60
    
    # Si marca ANTES de la hora (minutes_late < 0), es PRESENTE.
    if minutes_late <= TOLERANCIA_MINUTOS:
        attendance.status = AttendanceStatus.PRESENTE
    else:
        attendance.status = AttendanceStatus.TARDANZA
        # Generar Multa S/ 10.00
        # Primero limpiamos por si acaso (si remarcó)
        finance_service.void_penalty(db, user_id, meeting_id)
        finance_service.create_penalty(
            db, user_id, 10.00, f"Tardanza: {meeting.title}", meeting_id
        )

    db.commit()
    db.refresh(attendance)
    return attendance

def reject_attendance(db: Session, meeting_id: int, user_id: str, secretary_id: str):
    """
    Secretaria invalida una asistencia marcada. Se convierte en FALTA.
    """
    attendance = db.query(MeetingAttendance).filter_by(meeting_id=meeting_id, user_id=user_id).first()
    if not attendance:
        raise HTTPException(404, "Participante no encontrado.")
        
    meeting = db.query(Meeting).get(meeting_id)

    # 1. Cambiar estado
    attendance.status = AttendanceStatus.FALTA
    attendance.notes = f"Rechazado por Secretaría (ID: {secretary_id}) - No estaba en sala."
    attendance.check_in_time = None # Invalidamos su marca
    attendance.is_justified = False

    # 2. Ajuste Financiero
    # Si tenía multa de tardanza (10), la anulamos y creamos la de Falta (20)
    # Si estaba Presente (0), creamos la de Falta (20)
    finance_service.void_penalty(db, user_id, meeting_id) # Limpiar previo
    finance_service.create_penalty(
        db, user_id, 20.00, f"Falta (Rechazo Asistencia): {meeting.title}", meeting_id
    )
    
    db.commit()
    db.refresh(attendance)
    return attendance

def justify_attendance(db: Session, meeting_id: int, target_user_id: str, reason: str, secretary_id: str):
    """
    Justifica una falta o tardanza. 
    REGLA: Solo permitido dentro de las 24h posteriores al cierre de la reunión.
    """
    meeting = db.query(Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(404, "Reunión no encontrada.")
        
    attendance = db.query(MeetingAttendance).filter_by(meeting_id=meeting_id, user_id=target_user_id).first()
    if not attendance:
        raise HTTPException(404, "Participante no encontrado.")

    # 1. Validación de Ventana de Tiempo (24h)
    if meeting.real_end_time:
        deadline = meeting.real_end_time + timedelta(hours=VENTANA_JUSTIFICACION_HORAS)
        if datetime.now() > deadline:
            raise HTTPException(400, "El periodo de justificación (24h) ha expirado.")
    elif meeting.status == MeetingStatus.EN_CURSO:
        pass # Si sigue en curso, se puede justificar
    else:
        # Caso raro: no tiene end_time pero no está en curso (ej. Finalizada sin timestamp?)
        # Asumimos que si está finalizada debe tener end_time.
        pass 

    # 2. Aplicar Amnistía
    attendance.status = AttendanceStatus.JUSTIFICADA
    attendance.is_justified = True
    attendance.justification_reason = reason # Usamos el campo nuevo
    attendance.notes = f"{attendance.notes or ''} | Justificado por Admin: {reason}"

    # 3. Borrar Deudas (El alivio financiero)
    finance_service.void_penalty(db, target_user_id, meeting_id)

    db.commit()
    db.refresh(attendance)
    return attendance
