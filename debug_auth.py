
import sys
import os

# Agregamos el directorio actual al path para importar módulos
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend import auth, oauth2, models, database, schemas
from backend.database import SessionLocal
from jose import jwt

def test_auth_flow():
    db = SessionLocal()
    try:
        print("1. Checking Users in DB...")
        users = db.query(models.User).all()
        print(f"   Found {len(users)} users.")
        if not users:
            print("   ❌ NO USERS FOUND. Login will fail.")
            return

        test_user = users[0]
        print(f"   Testing with User: {test_user.email}")

        print("\n2. Generating Token...")
        access_token = auth.create_access_token(data={"sub": test_user.email})
        print(f"   Token: {access_token[:20]}...")

        print("\n3. Validating Token (Simulating get_current_user)...")
        try:
            payload = jwt.decode(access_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
            email = payload.get("sub")
            print(f"   Decoded Email: {email}")
            
            if email != test_user.email:
                 print("   ❌ Email mismatch!")
            else:
                 print("   ✅ Email matches.")
            
            db_user = db.query(models.User).filter(models.User.email == email).first()
            if db_user:
                print(f"   ✅ User found in DB: {db_user.id}")
            else:
                print("   ❌ User NOT found in DB after decode (Ghost user?)")

        except Exception as e:
            print(f"   ❌ Token Validation Failed: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    test_auth_flow()
