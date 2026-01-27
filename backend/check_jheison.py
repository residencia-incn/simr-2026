import os
import sys

# Add backend directory to path so we can import from database.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from sqlalchemy import text

def check_user():
    db = SessionLocal()
    try:
        email = "jheison1994@gmail.com"
        result = db.execute(text("SELECT id, email, dni, password, name FROM users WHERE email = :email"), {"email": email})
        user = result.fetchone()
        if user:
            print(f"Usuario encontrado:")
            print(f"ID: {user[0]}")
            print(f"Email: {user[1]}")
            print(f"DNI: {user[2]}")
            print(f"Password Hash: {user[3][:20]}...")
            print(f"Nombre: {user[4]}")
            
            # Verificar si el hash coincide con el DNI
            import bcrypt
            dni = str(user[2]) if user[2] else ""
            if dni and bcrypt.checkpw(dni[0:15].encode('utf-8'), user[3].encode('utf-8')):
                print("✅ La contraseña actual ES el DNI (truncado a 15).")
            elif bcrypt.checkpw("123456".encode('utf-8'), user[3].encode('utf-8')):
                print("✅ La contraseña actual ES '123456'.")
            else:
                print("❌ La contraseña no es ni el DNI ni '123456'.")
        else:
            print(f"Usuario '{email}' no encontrado.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user()
