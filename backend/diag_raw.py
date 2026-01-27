import os
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

SERVICE_ACCOUNT_FILE = 'google_credentials.json'
SCOPES = ['https://www.googleapis.com/auth/drive']

def check_raw_storage():
    print("--- REVISIÓN DE CUOTA RAW ---")
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print("❌ Error: google_credentials.json no encontrado.")
        return

    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    service = build('drive', 'v3', credentials=creds)
    
    about = service.about().get(fields="storageQuota, user").execute()
    quota = about.get('storageQuota', {})
    
    limit = int(quota.get('limit', 0))
    usage = int(quota.get('usage', 0))
    
    print(f"📊 RAW USAGE: {usage} bytes")
    print(f"📊 RAW LIMIT: {limit} bytes")
    
    if limit > 0:
        print(f"📊 PERCENTAGE: {(usage/limit)*100:.6f}%")
    else:
        print("📊 LIMIT IS ZERO (No storage allocated?)")

    # Listar TODO lo que el robot posee
    print("\n🔍 Listando todos los archivos propiedad del robot (sin filtros):")
    results = service.files().list(
        q="'me' in owners",
        fields="files(id, name, size, mimeType)",
        pageSize=10
    ).execute()
    
    files = results.get('files', [])
    for f in files:
        print(f"   - {f['name']} ({f.get('size', 'N/A')} bytes) [Type: {f['mimeType']}]")

if __name__ == "__main__":
    check_raw_storage()
