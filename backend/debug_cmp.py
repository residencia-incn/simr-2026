from database import SessionLocal
import models

def check_cmp(cmp_val):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.cmp_number == cmp_val).first()
        if user:
            print(f"Found User: {user.email}, CMP: {user.cmp_number}")
        else:
            print(f"No User found with CMP: {cmp_val}")
            
        req = db.query(models.RegistrationRequest).filter(models.RegistrationRequest.cmp_number == cmp_val).first()
        if req:
            print(f"Found Request: {req.email}, CMP: {req.cmp_number}")
        else:
            print(f"No Request found with CMP: {cmp_val}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    val = sys.argv[1] if len(sys.argv) > 1 else "092079"
    check_cmp(val)
    check_cmp(val.lstrip('0'))
