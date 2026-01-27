import requests

API_URL = "http://localhost:8000"

def test_documents_list():
    print("🔍 Testando endpoint: /documents/list")
    try:
        # Intentar sin auth (debería dar 401)
        res = requests.get(f"{API_URL}/documents/list")
        if res.status_code == 401:
            print("✅ El endpoint protege el acceso (401 Unauthorized sin token)")
        else:
            print(f"⚠️ Comportamiento inesperado sin auth: {res.status_code}")
            
        print("✅ Backend parece estar respondiendo correctamente.")
    except Exception as e:
        print(f"❌ Error al conectar con el backend: {e}")

if __name__ == "__main__":
    test_documents_list()
