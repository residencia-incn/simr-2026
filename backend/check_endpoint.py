import urllib.request
import urllib.error

url = "http://localhost:8000/accounting-v2/stats"

try:
    print(f"Fetching {url}...")
    with urllib.request.urlopen(url) as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
