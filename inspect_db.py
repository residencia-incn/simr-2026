import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.database import SessionLocal
from backend import models, auth
import bcrypt

def inspect_user():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "admin@simr.pe").first()
        if not user:
            print("User not found")
            # Try finding any user to see what's there
            all_users = db.query(models.User).all()
            print(f"Total users: {len(all_users)}")
            for u in all_users:
                print(f"Email in DB: '{u.email}'")
            return

        print(f"User found: '{user.email}'")
        print(f"Password Hash in DB: '{user.password}'")
        
        # Test verification logic manually
        test_pass = "admin123"
        is_ok = auth.verify_password(test_pass, user.password)
        print(f"Manual check with auth.verify_password: {is_ok}")
        
        # Direct bcrypt check
        try:
            direct_ok = bcrypt.checkpw(test_pass.encode('utf-8'), user.password.encode('utf-8'))
            print(f"Direct bcrypt check: {direct_ok}")
        except Exception as e:
            print(f"Direct bcrypt check failed with error: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    inspect_user()
