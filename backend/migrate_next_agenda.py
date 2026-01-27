import sys
import os
from sqlalchemy import text
from database import engine

def migrate():
    try:
        with engine.connect() as conn:
            print("Verificando si la columna 'next_meeting_agenda' existe...")
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='meetings' AND column_name='next_meeting_agenda'"))
            if result.fetchone():
                print("La columna 'next_meeting_agenda' ya existe.")
                return

            print("Agregando columna 'next_meeting_agenda' a la tabla 'meetings'...")
            conn.execute(text("ALTER TABLE meetings ADD COLUMN next_meeting_agenda JSONB"))
            conn.commit()
            print("Migración completada exitosamente.")
    except Exception as e:
        print(f"Error durante la migración: {e}")
        # Try without JSONB if it's not Postgres (maybe SQLite)
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE meetings ADD COLUMN next_meeting_agenda JSON"))
                conn.commit()
                print("Migración completada exitosamente (usando JSON en vez de JSONB).")
        except Exception as e2:
             print(f"Error fatal: {e2}")

if __name__ == "__main__":
    migrate()
