import requests

BASE_URL = "http://localhost:8000"

def test_endpoint(path, name):
    try:
        response = requests.get(f"{BASE_URL}{path}")
        if response.status_code == 200:
            print(f"✅ {name}: OK (200)")
        else:
            print(f"❌ {name}: Failed ({response.status_code})")
            print(response.text[:500])
    except Exception as e:
        print(f"❌ {name}: Connection Error - {e}")

test_endpoint("/treasury/config/settings", "Treasury Settings")
test_endpoint("/treasury/config/accounts", "Treasury Accounts (FAILING)")
test_endpoint("/accounting/transactions", "Accounting Transactions")
test_endpoint("/planning/meetings", "Planning Meetings (500 Fix)")
test_endpoint("/", "Health Check")
