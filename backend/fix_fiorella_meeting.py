from sqlalchemy.orm import Session
from database import SessionLocal
from models import MeetingAttendance, User, AttendanceStatus

def fix_fiorella():
    db: Session = SessionLocal()
    try:
        # 1. Buscar a Fiorella
        user = db.query(User).filter(User.name.ilike("%Fiorella%")).first()
        if not user:
            print("❌ Fiorella no encontrada")
            return
            
        # 2. Reunion 2 (ID 34)
        meeting_id = 34
        
        # 3. Add Attendance
        existing = db.query(MeetingAttendance).filter_by(meeting_id=meeting_id, user_id=user.id).first()
        if existing:
            print("✅ Fiorella ya está en la reunión")
        else:
            new_att = MeetingAttendance(
                meeting_id=meeting_id,
                user_id=user.id,
                status=AttendanceStatus.PENDIENTE
            )
            db.add(new_att)
            db.commit()
            print(f"🚀 Fiorella ({user.id}) añadida exitosamente a la reunión 34")
            
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_fiorella()
