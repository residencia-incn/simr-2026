import os
from sqlalchemy import create_engine, inspect

# Obtener URL de la base de datos
DATABASE_URL = "postgresql://usuario_medico:password123@localhost:5432/simr_db"

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    print("--- Estructura de bank_accounts ---")
    columns = inspector.get_columns('bank_accounts')
    for column in columns:
        print(f"Columna: {column['name']} | Tipo: {column['type']} | Nullable: {column['nullable']}")
        
    print("\n--- Índices ---")
    indices = inspector.get_index_names('bank_accounts')
    print(indices)

except Exception as e:
    print(f"Error: {e}")
