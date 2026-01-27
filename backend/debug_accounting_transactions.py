from database import SessionLocal
from routers.accounting import get_transactions
import sys
import traceback

def test_endpoint():
    db = SessionLocal()
    try:
        print("Calling get_transactions directly...")
        results = get_transactions(db)
        print(f"Success! Retrieved {len(results)} transactions.")
        if len(results) > 0:
            print("Sample:", results[0])
    except Exception:
        # The function itself catches exceptions, but let's see if we can trigger something or if it prints to stdout
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_endpoint()
