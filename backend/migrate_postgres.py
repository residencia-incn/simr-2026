from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://usuario_medico:password123@localhost:5432/simr_db"

def migrate():
    print("Migrating Postgres database...")
    engine = create_engine(DATABASE_URL)
    try:
        with engine.connect() as conn:
            # For Postgres, DDL usually requires scalar execution or autocommit block
            conn.execution_options(isolation_level="AUTOCOMMIT")
            
            # Check if table exists to be safe
            result = conn.execute(text("SELECT to_regclass('public.meeting_attendance')"))
            if result.scalar():
                print("Table meeting_attendance found. Adding column...")
                try:
                    conn.execute(text("ALTER TABLE meeting_attendance ADD COLUMN IF NOT EXISTS justification_reason VARCHAR(500)"))
                    print("Added justification_reason column successfully.")
                except Exception as e:
                    print(f"Error executing ALTER: {e}")
            else:
                print("Table meeting_attendance NOT FOUND. Check your table names.")
                
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    migrate()
