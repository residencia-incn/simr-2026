from database import engine
from sqlalchemy import text

def fix_casing():
    # Columnas que suelen dar problemas de case sensitivity en Postgres si no se citan
    to_fix = [
        ("isactive", '"isActive"'),
    ]
    
    with engine.connect() as conn:
        print("🛠️ Corrigiendo nombres de columnas (Case Sensitivity)...")
        for old, new in to_fix:
            try:
                # Primero verificamos si existe la vieja
                conn.execute(text(f'ALTER TABLE event_roadmap RENAME COLUMN {old} TO {new}'))
                print(f"✅ Columna '{old}' renombrada a {new}.")
            except Exception as e:
                print(f"ℹ️ Saltando '{old}': {e}")
        conn.commit()
    print("🚀 Corrección de casing completada.")

if __name__ == "__main__":
    fix_casing()
