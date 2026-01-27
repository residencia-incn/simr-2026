import requests
from database import SessionLocal
import models
from auth import create_access_token
import datetime
import uuid

# Setup
db = SessionLocal()
base_url = "http://localhost:8000"

def test_coupon_flow():
    # Get ANY user for token
    user = db.query(models.User).first()
    if not user:
        print("No users in DB to generate token.")
        return

    req_token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {req_token}"}
    
    code = "TEST50-MOD-" + str(uuid.uuid4())[:8].upper()
    
    # 1. Create Coupon DIRECTLY in DB
    print(f"Creating coupon {code} directly in DB...")
    
    modality = db.query(models.RegistrationModality).first()
    target_mod = modality.code if modality else "t_residente"
    
    new_coupon = models.Coupon(
        code=code,
        description="50% off Modality Test",
        expiry=datetime.date(2030, 1, 1),
        max_uses=10,
        discount_type="PERCENTAGE",
        discount_value=50,
        target_modules=[target_mod],
        active=True,
        group_tag="TEST-SCRIPT",
        created_by=user.id
    )
    db.add(new_coupon)
    db.commit()
    
    try:
        # 2. Validate via API (With Token)
        print("Validating via API...")
        val_resp = requests.post(f"{base_url}/coupons/validate", json={"code": code}, headers=headers)
        
        if val_resp.status_code != 200:
             print(f"Validation Request Failed: {val_resp.status_code} {val_resp.text}")
             return

        data = val_resp.json()
        
        if data.get("status") == "valid":
            print("Validation OK.")
            benefits = data.get("benefits", {})
            print(f"Benefits: {benefits}")
            
            if benefits.get("discount_value") == 50 and target_mod in benefits.get("target_modules", []):
                print("SUCCESS: Micro-surgery fields returned correctly.")
            else:
                 print(f"FAILURE: Fields mismatch. Expected 50 & [{target_mod}]. Got {benefits.get('discount_value')} & {benefits.get('target_modules')}")
        else:
            print(f"Validation failed status: {data}")

    finally:
        # 3. Cleanup
        print("Cleaning up...")
        db.delete(new_coupon)
        db.commit()

if __name__ == "__main__":
    try:
        test_coupon_flow()
    except Exception as e:
        print(f"Error: {e}")

