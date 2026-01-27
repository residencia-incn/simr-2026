
import sys
import os
import json
from sqlalchemy import text
# Add backend to path
sys.path.append(os.path.abspath('backend'))

from database import SessionLocal
from models import User

def migrate_roles():
    print("Starting Role Migration...")
    db = SessionLocal()
    try:
        # 1. Check if column exists
        check_sql = text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='roles';")
        exists = db.execute(check_sql).scalar()
        
        if not exists:
            print("Column 'roles' missing. Adding it...")
            # Postgres specific: JSONB is better, but let's stick to JSON to match SQLAlchemy model hint if generic
            # But verifying SQLAlchemy maps JSON to JSON type in Postgres usually.
            # We will use JSONB for efficiency if it is Postgres, otherwise JSON.
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN roles JSONB DEFAULT '[\"participante\"]'::jsonb;"))
            except Exception as e:
                print(f"JSONB failed, trying JSON: {e}")
                db.rollback()
                db.execute(text("ALTER TABLE users ADD COLUMN roles JSON DEFAULT '[\"participante\"]';"))
            
            db.commit()
            print("Column 'roles' added successfully.")
        else:
            print("Column 'roles' already exists.")

        # 2. Sync eventRole -> roles (Data Migration)
        print("Syncing eventRole to roles list...")
        users = db.query(User).all()
        count = 0
        for u in users:
            # Ensure roles is a list
            current_roles = u.roles
            if current_roles is None:
                current_roles = ["participante"]
            
            # If default logic didn't work or previous data is weird
            if isinstance(current_roles, str):
                try:
                    current_roles = json.loads(current_roles)
                except:
                    current_roles = ["participante"]
            
            updated = False
            # Check eventRole
            if u.eventRole:
                # Normalize role string (lowercase?) - keeping it as is for now
                role = u.eventRole
                if role not in current_roles:
                    current_roles.append(role)
                    updated = True
            
            if updated or u.roles is None:
                u.roles = current_roles
                count += 1
        
        db.commit()
        print(f"Data migration complete. Updated {count} users.")

    except Exception as e:
        print(f"Migration Failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_roles()
