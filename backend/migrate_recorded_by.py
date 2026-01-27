import sys
import os
from sqlalchemy import text
from database import engine

def migrate():
    print("Iniciando migración de base de datos Postgres...")
    try:
        with engine.connect() as conn:
            # Verificar si la columna ya existe
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='financial_transactions' AND column_name='recorded_by_id';
            """)
            result = conn.execute(check_query).fetchone()
            
            if not result:
                print("Añadiendo columna 'recorded_by_id' a la tabla 'financial_transactions'...")
                conn.execute(text("ALTER TABLE financial_transactions ADD COLUMN recorded_by_id VARCHAR;"))
                conn.execute(text("ALTER TABLE financial_transactions ADD CONSTRAINT fk_recorded_by FOREIGN KEY (recorded_by_id) REFERENCES users(id);"))
                conn.commit()
                print("✅ Columna añadida exitosamente.")
            else:
                print("ℹ️ La columna 'recorded_by_id' ya existe.")
                
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
