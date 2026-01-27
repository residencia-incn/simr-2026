
import sys
import os
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal

def deep_clean_penalties():
    db = SessionLocal()
    try:
        print("--- DEEP CLEANING PENALTY DESCRIPTIONS ---")
        
        tables = ['penalties', 'financial_records', 'incomes']
        for table in tables:
            print(f"Cleaning table: {table}")
            # Remove "Multa " with space
            db.execute(text(f"UPDATE {table} SET concept = REPLACE(concept, 'Multa ', '') WHERE concept LIKE '%Multa %'"))
            # Remove "Multa" if it was attached differently
            db.execute(text(f"UPDATE {table} SET concept = REPLACE(concept, 'Multa', '') WHERE concept LIKE '%Multa%'"))
        
        db.commit()
        print("Done. All 'Multa' keywords removed from all tables.")

        # Verification
        print("\nRecords sample:")
        res = db.execute(text("SELECT concept FROM incomes WHERE category='Penalidades' LIMIT 5")).fetchall()
        for row in res:
            print(f"  - {row[0]}")

    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    deep_clean_penalties()
