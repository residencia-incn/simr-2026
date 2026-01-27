
import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def fix_penalty_redundancy():
    db = SessionLocal()
    try:
        print("--- CLEANING PENALTY DESCRIPTIONS ---")
        
        # 1. Update 'penalties' table
        print("Updating 'penalties' table...")
        db.execute(text("""
            UPDATE penalties 
            SET concept = REPLACE(concept, 'Multa ', '') 
            WHERE concept LIKE 'Multa %';
        """))
        db.execute(text("""
            UPDATE penalties 
            SET concept = REPLACE(concept, 'Multa', '') 
            WHERE concept LIKE 'Multa%';
        """))

        # 2. Update 'financial_records' table
        print("Updating 'financial_records' table...")
        db.execute(text("""
            UPDATE financial_records 
            SET concept = REPLACE(concept, 'Multa ', '') 
            WHERE concept LIKE 'Multa %';
        """))
        db.execute(text("""
            UPDATE financial_records 
            SET concept = REPLACE(concept, 'Multa', '') 
            WHERE concept LIKE 'Multa%';
        """))

        # 3. Update 'incomes' table
        print("Updating 'incomes' table...")
        db.execute(text("""
            UPDATE incomes 
            SET concept = REPLACE(concept, 'Multa ', '') 
            WHERE concept LIKE 'Multa %';
        """))
        db.execute(text("""
            UPDATE incomes 
            SET concept = REPLACE(concept, 'Multa', '') 
            WHERE concept LIKE 'Multa%';
        """))

        db.commit()
        print("Done. Redundancy 'Multa' removed from all tables.")

    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_penalty_redundancy()
