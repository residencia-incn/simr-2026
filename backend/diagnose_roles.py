
import sys
import os
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def list_users():
    db = SessionLocal()
    try:
        print("--- USER ROLE DIAGNOSIS ---")
        users = db.query(models.User).all()
        print(f"Total Users: {len(users)}")
        
        for u in users:
            print(f"ID: {u.id} | Name: {u.firstName} {u.lastName} | EventRole: '{u.eventRole}' | Roles (JSON): {u.roles}")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
