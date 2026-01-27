from sqlalchemy import text
from database import engine, Base
import models

def migrate():
    print("⏳ Iniciando migración de transacciones y accesos...")
    
    # 1. Crear la tabla 'transactions' si no existe
    # create_all se encarga de las tablas nuevas
    models.Base.metadata.create_all(bind=engine)
    print("✅ Tabla 'transactions' verificada/creada.")

    # 2. Agregar columnas faltantes a 'users' (SQLite/PostgreSQL compatible)
    # Usamos conexiones independientes para cada columna para evitar que un error de "ya existe" aborte el script
    
    def add_column(column_query, column_name):
        with engine.connect() as conn:
            try:
                conn.execute(text(column_query))
                conn.commit()
                print(f"✅ Columna '{column_name}' agregada a 'users'.")
            except Exception as e:
                conn.rollback()
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"ℹ️ La columna '{column_name}' ya existe.")
                else:
                    print(f"❌ Error al agregar '{column_name}': {e}")

    add_column("ALTER TABLE users ADD COLUMN modality_id INTEGER", "modality_id")
    add_column("ALTER TABLE users ADD COLUMN workshops JSON", "workshops")

    print("🏁 Migración completada exitosamente.")

if __name__ == "__main__":
    migrate()
