
import requests
import sys

BASE_URL = "http://localhost:8000"

def check_endpoint(name, url):
    print(f"Checking {name} ({url})...")
    try:
        resp = requests.get(f"{BASE_URL}{url}", timeout=5)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"Success! {len(resp.json())} items found.")
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_endpoint("Transactions", "/accounting/transactions")
    check_endpoint("Pending Registrations (Mock)", "/accounting/transactions?status=pending")
    check_endpoint("Categories", "/accounting/transactions") # getCategories uses mocking in frontend usually, but let's check basic
    check_endpoint("Request Staging", "/accounting/requests")
    check_endpoint("Users", "/users")
    check_endpoint("Attendees", "/attendees") # Does this exist?
    check_endpoint("Budgets", "/accounting/budgets")
