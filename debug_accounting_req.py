import requests
import json

# Use the token if needed, but the endpoint seems open in the code (no Depends(oauth2...))
url = "http://localhost:8000/accounting/requests"

try:
    print(f"GET {url}")
    r = requests.get(url)
    print(f"Status: {r.status_code}")
    print(f"Headers: {r.headers}")
    try:
        data = r.json()
        print(f"Data type: {type(data)}")
        print(f"Count: {len(data)}")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Failed to parse JSON: {r.text}")
except Exception as e:
    print(f"Request failed: {e}")
