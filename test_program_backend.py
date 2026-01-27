import requests
import datetime

BASE_URL = "http://localhost:8000"

def log(msg, success=True):
    icon = "✅" if success else "❌"
    print(f"{icon} {msg}")

def test_program_flow():
    print("🚀 Starting Program Module Verification...\n")
    
    # 1. Create Location
    print("--- 1. Testing Locations ---")
    loc_payload = {"name": "Auditorio Test", "type": "fisica", "capacity": 100}
    try:
        res = requests.post(f"{BASE_URL}/program/locations", json=loc_payload)
        if res.status_code == 200:
            loc_id = res.json()['id']
            log(f"Location created: ID {loc_id}")
        else:
            log(f"Failed to create location: {res.text}", False)
            return
    except Exception as e:
        log(f"Connection error: {str(e)}", False)
        return

    # 2. Create Block
    print("\n--- 2. Testing Schedule Blocks ---")
    today = datetime.date.today().isoformat()
    block_payload = {
        "name": "Bloque Mañana",
        "date": today,
        "startTime": "08:00:00",
        "endTime": "12:00:00"
    }
    try:
        res = requests.post(f"{BASE_URL}/program/blocks", json=block_payload)
        if res.status_code == 200:
            block_id = res.json()['id']
            log(f"Block created: ID {block_id} ({block_payload['startTime']} - {block_payload['endTime']})")
        else:
            log(f"Failed to create block: {res.text}", False)
            return
    except Exception as e:
        log(f"Error: {e}", False)
        return

    # 3. Create Activity (Success Case)
    print("\n--- 3. Testing Activity Creation (Valid) ---")
    act_payload = {
        "title": "Conferencia Inaugural",
        "type": "ponencia",
        "status": "publicado",
        "startTime": f"{today}T09:00:00",
        "endTime": f"{today}T10:00:00",
        "block_id": block_id,
        "location_id": loc_id
    }
    try:
        res = requests.post(f"{BASE_URL}/program/activities", json=act_payload)
        if res.status_code == 200:
            log(f"Activity created: {res.json()['id']}")
        else:
            log(f"Failed to create valid activity: {res.text}", False)
    except Exception as e:
        log(f"Error: {e}", False)

    # 4. Create Activity (Failure Case - Out of Block)
    print("\n--- 4. Testing Activity Creation (Invalid Time) ---")
    invalid_payload = act_payload.copy()
    invalid_payload["startTime"] = f"{today}T07:00:00" # Before block start
    try:
        res = requests.post(f"{BASE_URL}/program/activities", json=invalid_payload)
        if res.status_code == 400:
            log(f"Correctly rejected invalid time: {res.json()['detail']}")
        else:
            log(f"Unexpected success for invalid time: {res.status_code}", False)
    except Exception as e:
        log(f"Error: {e}", False)

    # 5. Public View
    print("\n--- 5. Testing Public View ---")
    try:
        res = requests.get(f"{BASE_URL}/program/public")
        if res.status_code == 200:
            data = res.json()
            if today in data:
                log(f"Public view returns activities for today: {len(data[today])} items")
            else:
                log("Public view returned empty for today (Check if created activity was PUBLIC)", False)
        else:
            log(f"Failed to fetch public view: {res.text}", False)
    except Exception as e:
        log(f"Error: {e}", False)

if __name__ == "__main__":
    test_program_flow()
