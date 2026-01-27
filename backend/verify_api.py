import requests
import json

base_url = "http://localhost:8000/committee"

def print_section(title):
    print(f"\n{'='*40}")
    print(f" {title}")
    print(f"{'='*40}")

try:
    print_section("0. Testing GROUPs Endpoint")
    response = requests.get(f"{base_url}/groups")
    if response.status_code == 200:
        groups = response.json()
        print(f"✅ Success. Found {len(groups)} groups.")
        for g in groups:
            print(f"   - [{g['id']}] {g['name']} (Order: {g['order']})")
    else:
        print(f"❌ Failed: {response.text}")

    print_section("1. Testing CANDIDATES Endpoint")
    response = requests.get(f"{base_url}/candidates")
    if response.status_code == 200:
        candidates = response.json()
        print(f"✅ Success. Found {len(candidates)} candidates.")
        if len(candidates) > 0:
            print(f"   Example: {candidates[0]['name']}")
    else:
        print(f"❌ Failed: {response.text}")
    
    # Try creating a member if candidates exist and groups exist
    if response.status_code == 200 and len(candidates) > 0 and len(groups) > 0:
        candidate_id = candidates[0]['id']
        group_id = groups[0]['id']
        
        print_section("2. Testing CREATE MEMBER")
        payload = {
            "user_id": candidate_id,
            "position": "Tester Auto",
            "committee_id": group_id,
            "priority": 1
        }
        res_post = requests.post(f"{base_url}/", json=payload)
        if res_post.status_code == 200:
            member = res_post.json()
            print(f"✅ Success. Member created: {member['fullName']} in {member['committee']['name']}")
            created_id = member['id']
            
            print_section("3. Testing PUBLIC MEMBER LIST")
            res_list = requests.get(f"{base_url}/")
            members = res_list.json()
            print(f"✅ Success. Found {len(members)} active members.")
            
            print_section("4. Testing DELETE MEMBER")
            res_del = requests.delete(f"{base_url}/{created_id}")
            if res_del.status_code == 200:
                print("✅ Success. Member deleted.")
            else:
                print(f"❌ Failed delete: {res_del.text}")
                
        else:
            print(f"❌ Failed create: {res_post.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
