from database import engine
from sqlalchemy import text

def fix_enum():
    with engine.connect() as conn:
        print("🛠️ Iniciando reparación de esquema DB...")
        try:
            # 1. Intentar convertir la columna a VARCHAR directamente
            # Esto eliminará la restricción de enum
            conn.execute(text("ALTER TABLE payment_transactions ALTER COLUMN status TYPE VARCHAR"))
            conn.commit()
            print("✅ ÉXITO: Columna 'status' convertida a VARCHAR.")
        except Exception as e:
            print(f"❌ Error al alterar tabla: {e}")

if __name__ == "__main__":
    fix_enum()
