import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.database import SessionLocal, engine
from backend import models, auth
from sqlalchemy.orm import Session

def seed():
    db = SessionLocal()
    try:
        # 1. Verificar si ya existe
        existing_admin = db.query(models.User).filter(models.User.email == "admin@simr.pe").first()
        if existing_admin:
            print("El SuperAdmin ya existe.")
            return

        # 2. Crear el usuario
        hashed_password = auth.get_password_hash("admin123")
        
        super_admin = models.User(
            id="superadmin-001",
            email="admin@simr.pe",
            password=hashed_password,
            name="Super Administrador",
            firstName="Super",
            lastName="Admin",
            dni="00000000",
            eventRole="organizador",
            specialty="Sistemas",
            institution="INCN",
            isSuperAdmin=True,
            status="ACTIVO",
            permissions=["admin:all"],
            modules=["dashboard", "usuarios", "cursos", "configuracion"] 
        )

        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        print("✅ SuperAdmin creado exitosamente")
    except Exception as e:
        print(f"❌ Error durante el seed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
