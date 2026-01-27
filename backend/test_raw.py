
from database import engine
from sqlalchemy import text

def test_raw():
    conn = engine.connect()
    try:
        print("Testing RAW SQL...")
        # Try to select the column explicitly
        result = conn.execute(text("SELECT id, payment_id FROM penalties LIMIT 1")).fetchall()
        print(f"Result: {result}")
        print("✅ RAW SQL Success")
    except Exception as e:
        print(f"❌ RAW SQL Failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_raw()
