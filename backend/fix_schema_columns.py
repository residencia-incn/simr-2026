from sqlalchemy import text
from database import engine

def add_column_safe(table, column, type_def):
    try:
        with engine.connect() as conn:
            # Postgres syntax
            sql = f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {type_def};"
            conn.execute(text(sql))
            conn.commit()
            print(f"✅ Executed: {sql}")
    except Exception as e:
        print(f"⚠️ Error adding {column} to {table} (might overlap/sqlite mismatch): {e}")

def run_fix():
    print("🚑 Starting Schema Fix (Round 2)...")
    
    # Bank Accounts (Missing columns validation)
    add_column_safe("bank_accounts", "holder_name", "VARCHAR")
    
    # Meeting Agreements (Missing columns from 500 Error)
    add_column_safe("meeting_agreements", "assigned_user_id", "VARCHAR REFERENCES users(id)")
    add_column_safe("meeting_agreements", "deadline", "TIMESTAMP")
    add_column_safe("meeting_agreements", "is_completed", "BOOLEAN DEFAULT FALSE")
    
    print("🏁 Schema Fix Completed.")

if __name__ == "__main__":
    run_fix()
