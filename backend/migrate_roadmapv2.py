from database import engine
from sqlalchemy import text

def migrate():
    columns = [
        ("date_display", "VARCHAR"),
        ("icon_name", "VARCHAR DEFAULT 'Calendar'"),
        ("cta_text", "VARCHAR"),
        ("cta_link", "VARCHAR"),
        ('"order"', "INTEGER DEFAULT 0"),
        ("isActive", "BOOLEAN DEFAULT TRUE"),
        ("sort_date", "TIMESTAMP")
    ]
    
    for col_name, col_type in columns:
        with engine.connect() as conn:
            print(f"🔍 Verificando columna {col_name}...")
            try:
                # Corremos cada una en su propia transacción para evitar abortos en cadena
                conn.execute(text(f'ALTER TABLE event_roadmap ADD COLUMN {col_name} {col_type}'))
                conn.commit()
                print(f"✅ Columna {col_name} añadida.")
            except Exception as e:
                # Check for "already exists" in several ways
                if "already exists" in str(e).lower() or "DuplicateColumn" in str(e):
                    print(f"ℹ️ Columna {col_name} ya existe.")
                else:
                    print(f"❌ Error al añadir {col_name}: {e}")
    print("🚀 Migración de Roadmap (v2) completada.")

if __name__ == "__main__":
    migrate()
