from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE system_config ADD COLUMN IF NOT EXISTS registration_modalities JSON DEFAULT '[]'"))
            print("Added registration_modalities column.")
        except Exception as e:
            print(f"Error adding registration_modalities: {e}")

        try:
            conn.execute(text("ALTER TABLE system_config ADD COLUMN IF NOT EXISTS workshops JSON DEFAULT '[]'"))
            print("Added workshops column.")
        except Exception as e:
            print(f"Error adding workshops: {e}")
        
        conn.commit()

if __name__ == "__main__":
    migrate()
