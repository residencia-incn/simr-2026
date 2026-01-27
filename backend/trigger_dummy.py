
import sys
import os
import random
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine

def try_dummy_insert():
    print("--- DUMMY INSERT ---")
    try:
        with engine.connect() as conn:
            # Explicit transaction
            trans = conn.begin()
            try:
                rnd_id = random.randint(100000, 999999)
                # TEST 1: Only ID (Expect IntegrityError for missing columns)
                query = text("INSERT INTO penalties (id) VALUES (:id)")
                params = {"id": rnd_id}
                
                print(f"Executing with: {params}")
                conn.execute(query, params)
                trans.commit()
                print("SUCCESS!")
                print(f"Executing with: {params}")
                conn.execute(query, params)
                trans.commit()
                print("SUCCESS!")
            except Exception as e:
                trans.rollback()
                print(f"FAILED: {e}")
                import traceback
                traceback.print_exc()
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    try_dummy_insert()
