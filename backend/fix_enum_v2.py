
from sqlalchemy import create_engine, text

# Hardcoded from .env to avoid read issues
DATABASE_URL = "postgresql://usuario_medico:password123@localhost:5432/simr_db"

def fix_enums_v2():
    try:
        engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            print("🔧 FIX V2: Attempting to update pg_enum...")
            
            # 1. CANCELLED
            try:
                conn.execute(text("ALTER TYPE activitystatus ADD VALUE 'cancelado';"))
                print("✅ Added 'cancelado' (value) to activitystatus")
            except Exception as e:
                print(f"ℹ️ 'cancelado' note: {e}")

            # 2. ARCHIVED
            try:
                conn.execute(text("ALTER TYPE activitystatus ADD VALUE 'archivado';"))
                print("✅ Added 'archivado' (value) to activitystatus")
            except Exception as e:
                print(f"ℹ️ 'archivado' note: {e}")

            print("🏁 Migration V2 finished.")
    except Exception as main_e:
        print(f"🚨 CRITICAL DB ERROR: {main_e}")

if __name__ == "__main__":
    fix_enums_v2()
