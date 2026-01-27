from database import engine
from sqlalchemy import text, inspect

def migrate():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('system_config')]
    
    with engine.connect() as conn:
        if 'event_duration' not in columns:
            print("Agregando columna event_duration a system_config...")
            conn.execute(text('ALTER TABLE system_config ADD COLUMN event_duration INTEGER DEFAULT 3'))
            conn.commit()
            print("Columna agregada.")
        else:
            print("La columna event_duration ya existe.")

if __name__ == "__main__":
    migrate()
