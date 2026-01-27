import os
import io
import sys
import asyncio
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from dotenv import load_dotenv

# Load env variables
load_dotenv()

DRIVE_ROOT_ID = os.getenv("DRIVE_ROOT_ID")
SERVICE_ACCOUNT_FILE = 'google_credentials.json'
SCOPES = ['https://www.googleapis.com/auth/drive']

async def verify_drive_status():
    print("--- DIAGNÓSTICO PROFUNDO GOOGLE DRIVE ---")
    
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"❌ ERROR: Archivo {SERVICE_ACCOUNT_FILE} no encontrado.")
        return

    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        service = build('drive', 'v3', credentials=creds)
        print("✅ Cliente API Inicializado.")
        
        # 1. Verificar Cuota de la cuenta
        print("\n1. Verificando Cuota de Almacenamiento:")
        about = service.about().get(fields="storageQuota, user").execute()
        quota = about.get('storageQuota', {})
        user = about.get('user', {})
        
        limit = int(quota.get('limit', 0)) / (1024**3)
        usage = int(quota.get('usage', 0)) / (1024**3)
        
        print(f"   Cuenta: {user.get('emailAddress')}")
        print(f"   Límite: {limit:.2f} GB")
        print(f"   Uso: {usage:.2f} GB")
        
        if limit > 0 and (usage / limit) > 0.99:
            print("   🚨 ALERTA: Cuota excedida (100%)")
        else:
            print("   ✅ Espacio disponible en la cuenta de servicio.")

        # 2. Verificar Acceso a la carpeta raíz
        print("\n2. Verificando Carpeta Raíz:")
        try:
            folder = service.files().get(fileId=DRIVE_ROOT_ID, fields="id, name, capabilities").execute()
            print(f"   Nombre: {folder.get('name')}")
            print(f"   Capacidades: {folder.get('capabilities')}")
            if folder.get('capabilities', {}).get('canAddChildren'):
                print("   ✅ Permisos de escritura confirmados.")
            else:
                print("   ❌ ERROR: La cuenta de servicio NO tiene permisos para agregar archivos aquí.")
        except Exception as e:
            print(f"   ❌ ERROR al acceder a la carpeta: {e}")

        # 3. Intento de subida real
        print("\n3. Intento de subida de archivo pequeño (1KB):")
        file_metadata = {'name': 'test_final.txt', 'parents': [DRIVE_ROOT_ID]}
        media = MediaIoBaseUpload(io.BytesIO(b"Test upload"), mimetype='text/plain')
        try:
            file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
            print(f"   ✅ Subida EXITOSA. ID: {file.get('id')}")
            # Limpiar
            service.files().delete(fileId=file.get('id')).execute()
            print("   ✅ Archivo de prueba eliminado.")
        except Exception as e:
            print(f"   ❌ FALLO TOTAL en subida: {e}")

    except Exception as e:
        print(f"❌ Error general: {e}")

if __name__ == "__main__":
    asyncio.run(verify_drive_status())
