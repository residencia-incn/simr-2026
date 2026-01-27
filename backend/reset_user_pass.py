import os
import sys
import bcrypt

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from sqlalchemy import text
import utils

def reset_password(email, new_password):
    db = SessionLocal()
    try:
        print(f"Reseteando contraseña para {email}...")
        hashed_pw = utils.hash(new_password)
        
        result = db.execute(
            text("UPDATE users SET password = :password WHERE email = :email"),
            {"password": hashed_pw, "email": email}
        )
        db.commit()
        
        if result.rowcount > 0:
            print(f"✅ Contraseña reseteada con éxito para {email}.")
        else:
            print(f"❌ No se encontró al usuario con email {email}.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Reset specific user mentioned by the user
    reset_password("jheison1994@gmail.com", "123456")
    # Also reset the generic one if it existed (though we deleted NULLs)
    reset_password("residente@simr.pe", "123456")
