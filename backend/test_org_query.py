
import sys
import os
from sqlalchemy import or_, cast, String
from sqlalchemy.types import String as StringType

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def test_query():
    db = SessionLocal()
    try:
        print("--- TESTING IMPROVED QUERY ---")
        
        # Logic: eventRole == 'organizador' OR roles JSON contains 'organizador'
        # Since 'roles' is JSON, we might need specific dialect syntax or simple string casting for SQLite/Postgres compatibility if simple
        # For Postgres, JSONB contains is @>, for generic we might iterate or use specific func. 
        # But let's try a robust way: Filter in python if list is small, or mapped column.
        
        # Let's try simple OR first just to see candidates
        candidates = db.query(models.User).all()
        
        organizers = []
        for u in candidates:
            is_org = False
            if u.eventRole == 'organizador':
                is_org = True
            elif u.roles and isinstance(u.roles, list) and 'organizador' in u.roles:
                is_org = True
            
            if is_org:
                print(f"MATCH: {u.id} ({u.firstName} {u.lastName}) - Role: {u.eventRole} Roles: {u.roles}")
                organizers.append(u)
        
        print(f"Total Matches: {len(organizers)}")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_query()
