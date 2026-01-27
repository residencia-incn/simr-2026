import os
import sys

# Add backend directory to path so we can import from database.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from sqlalchemy import text

def cleanup_db():
    print("Iniciando conexión a la base de datos...")
    db = SessionLocal()
    try:
        print("Ejecutando: DELETE FROM users WHERE email IS NULL")
        result = db.execute(text("DELETE FROM users WHERE email IS NULL"))
        db.commit()
        # rowcount behavior varies by driver, but works for most
        print(f"✅ Operación exitosa. Filas eliminadas: {result.rowcount}")
        
        # Optional: Check if 'residente@simr.pe' exists (informational)
        result_check = db.execute(text("SELECT id, email, name FROM users WHERE email = 'residente@simr.pe'"))
        user = result_check.fetchone()
        if user:
            print(f"ℹ️ Información: El usuario 'residente@simr.pe' existe (ID: {user[0]}, Nombre: {user[2]}).")
        else:
            print("ℹ️ Información: El usuario 'residente@simr.pe' NO se encuentra en la base de datos.")

    except Exception as e:
        print(f"❌ Error al ejecutar la limpieza: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_db()
