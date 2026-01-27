from database import engine, Base
import models

def migrate_courses():
    print("🔄 Iniciando migración de Tabla 'courses'...")
    # create_all safely creates missing tables only
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tabla 'courses' verificada/creada con éxito.")
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate_courses()
