
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def fix_enums():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("🔧 Attempting to fix Enums...")
        
        # 1. CANCELLED
        try:
            conn.execute(text("ALTER TYPE activitystatus ADD VALUE 'CANCELLED';"))
            print("✅ Added 'CANCELLED' to activitystatus")
        except Exception as e:
            print(f"⚠️ 'CANCELLED' might already exist or error: {e}")

        # 2. ARCHIVED
        try:
            conn.execute(text("ALTER TYPE activitystatus ADD VALUE 'ARCHIVED';"))
            print("✅ Added 'ARCHIVED' to activitystatus")
        except Exception as e:
            print(f"⚠️ 'ARCHIVED' might already exist or error: {e}")
            
        conn.commit()
        print("🏁 Migration finished.")

if __name__ == "__main__":
    fix_enums()
