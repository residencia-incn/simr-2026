import requests
try:
    res = requests.get("http://localhost:8000/", timeout=5)
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.json()}")
except Exception as e:
    print(f"Error: {e}")
