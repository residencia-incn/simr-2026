from database import SessionLocal
from models import MeetingAttendance, AttendanceStatus, FinancialRecord, Penalty, Meeting, TransactionType, PaymentStatus
from services import finance_service
import sys

def fix_inconsistencies():
    print("🚑 Starting Data Repair for Justified Penalties...")
    db = SessionLocal()
    
    try:
        # 1. Find all JUSTIFIED attendances
        # Note: We check both the Status Enum and the boolean flag for safety
        justified = db.query(MeetingAttendance).filter(
            (MeetingAttendance.status == AttendanceStatus.JUSTIFICADA) | 
            (MeetingAttendance.is_justified == True)
        ).all()
        
        print(f"🔍 Found {len(justified)} justified attendance records.")
        
        fixed_count = 0
        
        for att in justified:
            user_id = att.user_id
            meeting_id = att.meeting_id
            
            # Use the new robust logic to void penalties
            # This looks for both FinancialRecord and Penalty tables
            # and annuls them if they exist and are PENDING
            
            # Since void_penalty doesn't return count, we'll verify manully
            meeting = db.query(Meeting).get(meeting_id)
            if not meeting: 
                continue
                
            print(f"   Checking User: {user_id} | Meeting: {meeting.title}...")
            
            # Manually check for existing PENDING penalties to count how many we fix
            pending_penalties = db.query(Penalty).filter(
                Penalty.user_id == user_id,
                Penalty.status == "PENDING",
                Penalty.concept.contains(meeting.title)
            ).count()
            
            if pending_penalties > 0:
                print(f"      -> FIXING: Found {pending_penalties} orphaned penalties.")
                try:
                    finance_service.void_penalty(db, user_id, meeting_id)
                    fixed_count += 1
                except Exception as e:
                    print(f"      -> ERROR: Could not void penalty: {e}")
            else:
                # Also run void just in case FinancialRecords are out of sync
                finance_service.void_penalty(db, user_id, meeting_id)

        db.commit()
        print(f"✅ REPAIR COMPLETE. Fixed {fixed_count} users with orphaned penalties.")
        
    except Exception as e:
        print(f"❌ FATAL ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_inconsistencies()
