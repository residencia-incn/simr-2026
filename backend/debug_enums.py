
import sys
import os
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine

def inspect_enums():
    try:
        with engine.connect() as connection:
            print("--- INSPECTING ENUMS ---")
            
            # Query pg_enum to get values for 'contributionstatus'
            # Note: The type name in Postgres is usually lowercase
            query = text("SELECT enum_range(NULL::contributionstatus)")
            result = connection.execute(query).scalar()
            print(f"Valid values for 'contributionstatus': {result}")
            
            # Check all columns in penalties
            query3 = text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'penalties'")
            result3 = connection.execute(query3).mappings().all()
            print("Columns in penalties table:")
            for col in result3:
                print(f"- {col['column_name']} ({col['data_type']}, Nullable: {col['is_nullable']})")
            # Check constraints on penalties.status
            print("Checking CHECK constraints...")
            query4 = text("""
                SELECT cc.check_clause 
                FROM information_schema.check_constraints cc
                JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = cc.constraint_name
                WHERE ccu.table_name = 'penalties' AND ccu.column_name = 'status'
            """)
            result4 = connection.execute(query4).fetchall()
            print(f"Check constraints on penalties.status: {result4}")

            # Check Triggers
            print("Checking Triggers...")
            query_trig = text("SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'penalties'")
            result_trig = connection.execute(query_trig).fetchall()
            print(f"Triggers on penalties: {result_trig}")

            print("--- TESTING RAW INSERT ---")
            try:
                # Use a random ID to avoid PK issues if possible, or expect FK error
                # We want to test 'PENDING' status.
                insert_query = text("INSERT INTO penalties (user_id, reason, amount, status) VALUES ('u_test_auth_check', 'Test Raw', 10.00, 'PENDING')")
                connection.execute(insert_query)
                print("Insert Attempt Result: SUCCESS (Rolled back automatically)")
            except Exception as insert_err:
                print(f"Insert Attempt Result: FAILED - {insert_err}")

    except Exception as e:
        print(f"ERROR: {e}")
        # Fallback: Try to fetch rows to see what's existing
        try:
            print("Querying existing rows for status...")
            with engine.connect() as conn:
                res = conn.execute(text("SELECT DISTINCT status FROM contributions LIMIT 5")).fetchall()
                print(f"Existing statuses in contributions: {res}")
        except Exception as e2:
            print(f"Fallback Error: {e2}")

if __name__ == "__main__":
    inspect_enums()
