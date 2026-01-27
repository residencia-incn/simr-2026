import requests
import json

url = "http://localhost:8000/auth/register-request"
data = {
    "personal_data": {
        "dni": "87654321", 
        "email": "debug@test.com", 
        "firstname": "Debug", 
        "lastname": "User",
        "phone": "999888777",
        "occupation": "Médico",
        "institution": "Test"
    },
    "payment_info": {
        "total_amount": 90, 
        "payment_account": "bcp"
    },
    "items_detail": {}
}

# Case 1: With file
files = {
    "voucher_file": ("test_voucher.txt", b"dummy content", "text/plain")
}
payload = {
    "registration_data": json.dumps(data)
}

print(f"Testing URL: {url}")

try:
    print("\n--- TEST 1: Sending WITH file ---")
    r = requests.post(url, data=payload, files=files)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Test 1 Failed: {e}")

try:
    print("\n--- TEST 2: Sending WITHOUT file ---")
    # When sending without files, requests uses application/x-www-form-urlencoded by default if data is dict,
    # unless we force it or use files argument trickery.
    # But here we want multipart/form-data because the endpoint expects Form data.
    # requests handles multipart if 'files' is present.
    # To send multipart without files, we can pass null file or just let it be.
    # Let's try just data=payload (form-urlencoded) -> Backend might reject if it strictly wants multipart.
    
    # Actually, let's try to simulate exactly what frontend does: Multipart with 'voucher_file' missing.
    # In requests, we can just omit it from files?
    r = requests.post(url, data=payload, files={}) 
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Test 2 Failed: {e}")
