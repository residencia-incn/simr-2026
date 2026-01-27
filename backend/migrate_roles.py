from database import engine, Base
import models

def migrate():
    print("🔄 Iniciando migración de Tablas de Roles...")
    # create_all es inteligente: solo crea lo que falta
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas 'role_profiles' verificadas/creadas con éxito.")

if __name__ == "__main__":
    migrate()
