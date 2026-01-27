
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import json

def update_superadmin_modules():
    db = SessionLocal()
    try:
        print("Buscando al SuperAdmin...")
        user = db.query(models.User).filter(models.User.email == "admin@simr.pe").first()
        
        if not user:
            print("No se encontro al usuario admin@simr.pe")
            return

        # ESTA es la estructura real que solicitaste
        new_modules = [
            "organizacion",   # Incluye gestión de usuarios
            "secretaria",
            "asistencia",
            "investigacion",
            "academico",
            "jurado",
            "contabilidad",
            "aula_virtual",
            "trabajos"        # Gestión de abstracts/posters
        ]

        print(f"Actualizando modulos a: {new_modules}")
        
        user.modules = new_modules
        
        db.commit()
        print("ADN Actualizado! El SuperAdmin ahora tiene los modulos correctos.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_superadmin_modules()
