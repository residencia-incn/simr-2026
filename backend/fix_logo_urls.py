
import sys
import os
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal

def normalize_logo_urls():
    db = SessionLocal()
    try:
        print("--- NORMALIZING LOGO URLs ---")
        
        # Update financial_institutions table
        print("Updating 'financial_institutions' table...")
        db.execute(text("""
            UPDATE financial_institutions 
            SET logo_url = REPLACE(logo_url, '/vouchers/logos/', '/archivo/logos/') 
            WHERE logo_url LIKE '%/vouchers/logos/%';
        """))

        db.commit()
        print("Done. All logo URLs updated to use /archivo/logos/.")

        # Verification
        res = db.execute(text("SELECT name, logo_url FROM financial_institutions WHERE logo_url LIKE '%/archivo/logos/%'")).fetchall()
        for row in res:
            print(f"  - {row[0]}: {row[1]}")

    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    normalize_logo_urls()
