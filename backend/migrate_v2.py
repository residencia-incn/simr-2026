from database import engine
from sqlalchemy import text, inspect

def migrate():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('system_config')]
    
    with engine.connect() as conn:
        # Add event_schedule
        if 'event_schedule' not in columns:
            print("Agregando columna event_schedule a system_config...")
            # Using JSON type depends on dialect, for SQLite it's fine
            conn.execute(text('ALTER TABLE system_config ADD COLUMN event_schedule JSON'))
            conn.commit()
            print("Columna event_schedule agregada.")
            
        # Add public_sections
        if 'public_sections' not in columns:
            print("Agregando columna public_sections a system_config...")
            conn.execute(text('ALTER TABLE system_config ADD COLUMN public_sections JSON'))
            conn.commit()
            print("Columna public_sections agregada.")

if __name__ == "__main__":
    migrate()
