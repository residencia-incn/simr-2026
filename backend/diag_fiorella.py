from sqlalchemy.orm import Session
from database import SessionLocal
from models import Meeting, MeetingAttendance, User

def diag_fiorella():
    db: Session = SessionLocal()
    try:
        # 1. Buscar a Fiorella
        user = db.query(User).filter(User.name.ilike("%Fiorella%")).first()
        if not user:
            print("❌ Fiorella no encontrada")
            # Listar usuarios
            users = db.query(User).limit(10).all()
            print("Usuarios:", [(u.id, u.name) for u in users])
            return
            
        print(f"✅ Usuario: {user.name} (ID: {user.id})")
        
        # 2. Buscar Reunion 2
        meeting = db.query(Meeting).filter(Meeting.title.ilike("%Reunion 2%")).first()
        if not meeting:
            print("❌ Reunion 2 no encontrada")
            return
        
        print(f"✅ Reunión: {meeting.title} (ID: {meeting.id}) Status: {meeting.status}")
        
        # 3. Check Attendance
        attendance = db.query(MeetingAttendance).filter_by(meeting_id=meeting.id, user_id=user.id).first()
        if attendance:
            print(f"✅ Asistencia Existe: ID={attendance.id}, Status={attendance.status}, UserID={attendance.user_id}")
            
            # 4. Probar la query exacta del dashboard
            from models import MeetingStatus
            res = db.query(Meeting).join(
                MeetingAttendance, Meeting.id == MeetingAttendance.meeting_id
            ).filter(
                MeetingAttendance.user_id == user.id,
                Meeting.status.in_([MeetingStatus.PROGRAMADA, MeetingStatus.EN_CURSO])
            ).all()
            
            print(f"\n--- Resultado Query Dashboard para {user.name} ---")
            print(f"Cantidad encontrada: {len(res)}")
            for m in res:
                print(f" - {m.title} (ID: {m.id})")
        else:
            print("❌ NO existe registro de asistencia para Fiorella en Reunion 2")
            
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    diag_fiorella()
