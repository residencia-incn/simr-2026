from database import engine
from sqlalchemy import text

def drop_transactions():
    with engine.connect() as conn:
        try:
            conn.execute(text("DROP TABLE IF EXISTS transactions CASCADE"))
            conn.commit()
            print("✅ Tabla 'transactions' eliminada.")
        except Exception as e:
            print(f"❌ Error al eliminar tabla: {e}")

if __name__ == "__main__":
    drop_transactions()
