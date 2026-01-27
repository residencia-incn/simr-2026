from database import SessionLocal
from models import Meeting, Penalty
import sys

def debug_data():
    db = SessionLocal()
    try:
        meeting_id = 47
        m = db.query(Meeting).get(meeting_id)
        if m:
            print(f"MEETING_TITLE: '{m.title}'")
            # Search for penalties related to this user
            user_id = "u_70939872" # Luis Juan Carlos
            penalties = db.query(Penalty).filter(Penalty.user_id == user_id).all()
            print(f"PENALTY_COUNT for {user_id}: {len(penalties)}")
            for p in penalties:
                print(f"  CONCEPT: '{p.concept}' | STATUS: '{p.status}'")
        else:
            print(f"Meeting {meeting_id} not found.")
    finally:
        db.close()

if __name__ == "__main__":
    debug_data()
