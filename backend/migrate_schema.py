from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Iniciando migración manual...")
        
        # 1. Agregar bank_account_id a financial_transactions si no existe
        try:
            conn.execute(text("ALTER TABLE financial_transactions ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id)"))
            conn.commit()
            print("✅ Columna bank_account_id añadida a financial_transactions.")
        except Exception as e:
            print(f"ℹ️ bank_account_id ya existe o error: {e}")
            conn.rollback()

        # 2. Cambiar amount de INTEGER a FLOAT en financial_transactions
        try:
            # En Postgres: ALTER TABLE ... ALTER COLUMN ... TYPE ...
            # En SQLite no se puede alterar tipo fácilmente, pero usualmente Integer/Float se manejan.
            # Intentaremos el comando Postgres
            conn.execute(text("ALTER TABLE financial_transactions ALTER COLUMN amount TYPE FLOAT USING amount::float"))
            conn.commit()
            print("✅ Tipo de columna 'amount' actualizado a FLOAT en financial_transactions.")
        except Exception as e:
            print(f"ℹ️ No se pudo cambiar tipo de amount (puede ser SQLite): {e}")
            conn.rollback()

        # 3. Cambiar amount de INTEGER a FLOAT en incomes
        try:
            conn.execute(text("ALTER TABLE incomes ALTER COLUMN amount TYPE FLOAT USING amount::float"))
            conn.commit()
            print("✅ Tipo de columna 'amount' actualizado a FLOAT en incomes.")
        except Exception as e:
            print(f"ℹ️ No se pudo cambiar tipo de amount en incomes: {e}")
            conn.rollback()

        print("Migración finalizada.")

if __name__ == "__main__":
    migrate()
