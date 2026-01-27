
from sqlalchemy import create_engine, text

# Hardcoded from .env
DATABASE_URL = "postgresql://usuario_medico:password123@localhost:5432/simr_db"

def fix_nuclear():
    try:
        engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            print("☢️ NUCLEAR OPTION: Converting Enums to TEXT...")
            
            # 1. Activities Status
            try:
                conn.execute(text("ALTER TABLE program_activities ALTER COLUMN status TYPE VARCHAR(50) USING status::text;"))
                print("✅ converted program_activities.status to VARCHAR")
            except Exception as e:
                print(f"ℹ️ status error: {e}")

            # 2. Activities Type
            try:
                conn.execute(text("ALTER TABLE program_activities ALTER COLUMN type TYPE VARCHAR(50) USING type::text;"))
                print("✅ converted program_activities.type to VARCHAR")
            except Exception as e:
                print(f"ℹ️ type error: {e}")

            # 3. Drop the Types? (Optional, but clean)
            try:
                # conn.execute(text("DROP TYPE activitystatus;")) 
                # conn.execute(text("DROP TYPE activitytype;"))
                print("ℹ️ Keeping types for reference, but columns are now free.")
            except Exception as e:
                pass

            print("🏁 Nuclear Fix finished.")
    except Exception as main_e:
        print(f"🚨 CRITICAL DB ERROR: {main_e}")

if __name__ == "__main__":
    fix_nuclear()
