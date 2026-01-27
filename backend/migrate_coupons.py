import models
from database import engine

def migrate():
    print("🚀 Iniciando migración de cupones...")
    try:
        # Esto creará las tablas que no existan
        models.Base.metadata.create_all(bind=engine)
        print("✅ Tabla 'coupons' verificada/creada correctamente.")
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate()
