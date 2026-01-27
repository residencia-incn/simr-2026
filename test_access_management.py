
import sys
import os
from fastapi.testclient import TestClient

# Ensure backend is in path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Explicitly import main
try:
    from main import app
    from database import SessionLocal
    from models import User, AuditLog
    # Create a mock oauth2 module if import fails? No, it should work.
    from routers import users # Verify routers package
    import oauth2 # explicit import to verify visibility
except ImportError as e:
    print(f"Import Error: {e}")
    # print sys.path to debug
    print(f"Sys Path: {sys.path}")
    raise e

from routers import oauth2 as oauth2_router # This is the dependency provider file

# Override get_db
def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

# Mock Auth
def override_get_current_user():
    db = SessionLocal()
    # Ensure admin exists
    admin = db.query(User).filter(User.email == "admin@simr.com").first()
    if not admin:
        admin = User(
            id="admin_test_id",
            email="admin@simr.com", 
            hashed_password="hashed_secret", 
            eventRole="admin",
            roles=["admin"],
            is_active=True
        )
        db.add(admin)
        db.commit()
    return admin

app.dependency_overrides[oauth2_router.get_current_user] = override_get_current_user

client = TestClient(app)

def test_unified_access_update():
    print("🚀 Starting Unified Access Test...")
    # 1. Setup Test User
    db = SessionLocal()
    target_email = "test_access@simr.com"
    target = db.query(User).filter(User.email == target_email).first()
    
    # Cleanup previous run
    if target:
        db.delete(target)
        db.commit()
        
    target = User(
        id="target_user_id",
        email=target_email,
        hashed_password="hashed",
        eventRole="participante",
        roles=["participante"],
        modules=["mi_perfil"],
        is_active=True
    )
    db.add(target)
    db.commit()
    
    target_id = target.id
    
    # 2. Call Endpoint
    payload = {
        "roles": ["organizador"],
        "modules": ["organizacion", "contabilidad"]
    }
    
    print(f"📡 Sending PUT /users/{target_id}/access...")
    response = client.put(f"/users/{target_id}/access", json=payload)
    
    # 3. Assertions
    if response.status_code != 200:
        print(f"❌ Error {response.status_code}: {response.text}")
    
    assert response.status_code == 200
    data = response.json()
    
    print(f"📥 Received: roles={data.get('roles')}, modules={data.get('modules')}")
    
    assert data["roles"] == ["organizador"]
    assert "organizacion" in data["modules"]
    
    # 4. Audit Log Check
    print("🔍 Checking Audit Log...")
    log = db.query(AuditLog).filter(AuditLog.target_user_id == target_id, AuditLog.action == "ACCESS_UPDATE").order_by(AuditLog.timestamp.desc()).first()
    assert log is not None
    print(f"📝 Log Found: {log.details}")
    
    print("✅ TEST PASSED: Unified Access Update verified.")
    db.close()

if __name__ == "__main__":
    test_unified_access_update()
