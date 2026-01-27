from sqlalchemy import create_engine, text
import os

# Ajusta tu URL de base de datos
DATABASE_URL = "postgresql://usuario_medico:password123@localhost:5432/simr_db"

def migrate_system_config():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Migrating SystemConfig...")
        
        # 1. Add 'registration_modalities' column
        try:
            conn.execute(text("ALTER TABLE system_config ADD COLUMN registration_modalities JSON DEFAULT '[]'"))
            conn.commit()
            print("Added registration_modalities column.")
        except Exception as e:
            print(f"registration_modalities check: {e}")
            conn.rollback() # Important for Postgres!

        # 2. Add 'workshops' column
        try:
            conn.execute(text("ALTER TABLE system_config ADD COLUMN workshops JSON DEFAULT '[]'"))
            conn.commit()
            print("Added workshops column.")
        except Exception as e:
            print(f"workshops check: {e}")
            conn.rollback()

    print("Migration complete!")

if __name__ == "__main__":
    migrate_system_config()
