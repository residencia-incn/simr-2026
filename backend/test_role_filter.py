import requests

BASE_URL = "http://localhost:8000"

def test_filtering(role):
    print(f"Testing filter for role: {role}")
    response = requests.get(f"{BASE_URL}/users/", params={"role": role})
    if response.status_code == 200:
        users = response.data if hasattr(response, 'data') else response.json()
        print(f"Found {len(users)} users.")
        for user in users:
            print(f" - {user['id']}: roles={user['roles']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_filtering("organizador")
    print("-" * 20)
    test_filtering("asistente")
