
from database import engine
from sqlalchemy import text, inspect

def fix_schema():
    conn = engine.connect()
    try:
        inspector = inspect(engine)
        
        # 1. Check if 'payment_transactions' exists (it might be new)
        if not inspector.has_table("payment_transactions"):
            print("Table 'payment_transactions' missing. Models should have created it if not present. Checking...")
            # If create_all ran, it should be there.
        
        # 2. Check 'incomes' table columns
        columns = [c['name'] for c in inspector.get_columns("incomes")]
        print(f"Columns in 'incomes': {columns}")
        
        if "origin_payment_id" not in columns:
            print("❌ 'origin_payment_id' missing in 'incomes'. Adding it...")
            try:
                conn.execute(text("ALTER TABLE incomes ADD COLUMN origin_payment_id INTEGER references payment_transactions(id)"))
                conn.commit()
                print("✅ Column added.")
            except Exception as e:
                print(f"⚠️ Error adding column: {e}")
        else:
            print("✅ 'origin_payment_id' exists.")

        # 3. Check 'contributions' table
        contrib_cols = [c['name'] for c in inspector.get_columns("contributions")]
        if "payment_id" not in contrib_cols:
            print("❌ 'payment_id' missing in 'contributions'. Adding it...")
            try:
                conn.execute(text("ALTER TABLE contributions ADD COLUMN payment_id INTEGER references payment_transactions(id)"))
                conn.commit()
                print("✅ Column added to contributions.")
            except Exception as e:
                print(f"⚠️ Error adding column to contributions: {e}")
        
        # 4. Check 'penalties' table
        penalty_cols = [c['name'] for c in inspector.get_columns("penalties")]
        if "payment_id" not in penalty_cols:
            print("❌ 'payment_id' missing in 'penalties'. Adding it...")
            try:
                conn.execute(text("ALTER TABLE penalties ADD COLUMN payment_id INTEGER references payment_transactions(id)"))
                conn.commit()
                print("✅ payment_id added to penalties.")
            except Exception as e:
                print(f"⚠️ Error adding payment_id to penalties: {e}")

        if "reason" not in penalty_cols:
            print("❌ 'reason' missing in 'penalties'. Adding it...")
            try:
                conn.execute(text("ALTER TABLE penalties ADD COLUMN reason TEXT"))
                conn.commit()
                print("✅ reason added to penalties.")
            except Exception as e:
                print(f"⚠️ Error adding reason to penalties: {e}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
