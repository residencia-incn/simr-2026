from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    print("--- INICIO TEST ---")
    password = "123456"
    print(f"Hashing '{password}' (len: {len(password)})")
    hashed = pwd_context.hash(password)
    print(f"EXITO: {hashed}")
except Exception as e:
    print(f"FALLO: {str(e)}")
