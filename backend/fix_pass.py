# Guardar como backend/fix_pass.py
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import auth # Importamos tu auth.py actual

def reset_password():
    db = SessionLocal()
    try:
        print("Buscando al usuario admin@simr.pe...")
        user = db.query(models.User).filter(models.User.email == "admin@simr.pe").first()
        
        if not user:
            print("ERROR: No se encontro al usuario. Asegurate de haber corrido el Seed primero.")
            return

        print("Generando nuevo Hash compatible con tu auth.py actual...")
        # Aqui usamos tu funcion actual para asegurar compatibilidad 100%
        new_hash = auth.get_password_hash("admin123")
        
        user.password = new_hash
        db.commit()
        
        print("EXITO! Contrasena actualizada.")
        print(f"   Hash generado: {new_hash[:10]}...")
        print("Intenta loguearte en el Frontend ahora.")
        
    except Exception as e:
        print(f"Error inesperado: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()