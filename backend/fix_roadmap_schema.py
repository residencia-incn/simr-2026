import os
import sys
from sqlalchemy import create_engine, text

# Hardcoded URL to avoid import issues in this one-off script
DATABASE_URL = "postgresql://usuario_medico:password123@localhost:5432/simr_db"

def fix_roadmap_schema():
    print(f"Connecting to database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking 'event_roadmap' table schema...")
        
        # 1. Add isActive
        try:
            conn.execute(text("ALTER TABLE event_roadmap ADD COLUMN isActive BOOLEAN DEFAULT TRUE"))
            print("✅ Added column 'isActive'")
        except Exception as e:
            print(f"⚠️ Column 'isActive' might already exist or error: {e}")
            
        # 2. Add order
        try:
            conn.execute(text("ALTER TABLE event_roadmap ADD COLUMN \"order\" INTEGER DEFAULT 0"))
            print("✅ Added column 'order'")
        except Exception as e:
            print(f"⚠️ Column 'order' might already exist or error: {e}")

        # 3. Add sort_date
        try:
            conn.execute(text("ALTER TABLE event_roadmap ADD COLUMN sort_date TIMESTAMP WITHOUT TIME ZONE"))
            print("✅ Added column 'sort_date'")
        except Exception as e:
            print(f"⚠️ Column 'sort_date' might already exist or error: {e}")

        # 4. Add display fields
        for col in ['date_display', 'cta_text', 'cta_link', 'icon_name']:
            try:
                conn.execute(text(f"ALTER TABLE event_roadmap ADD COLUMN {col} VARCHAR"))
                print(f"✅ Added column '{col}'")
            except Exception as e:
                conn.rollback() # Reset transaction if error occurs (e.g. column exists)
                print(f"⚠️ Column '{col}' might already exist or error: {e}")

        conn.commit()
    
    print("schema update complete.")

if __name__ == "__main__":
    fix_roadmap_schema()
