import os
import io
import sys
import asyncio
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.getcwd())

from services.drive_service import drive_client

async def test_transfer_failure():
    print("🧪 DIAGNÓSTICO DE TRANSFERENCIA DE PROPIEDAD (USANDO CARPETA)")
    load_dotenv()
    
    # 1. Crear una Carpeta (0 bytes, no debería dar QuotaExceeded)
    print("📡 Creando carpeta de prueba...")
    file_metadata = {
        'name': 'diagnostic_folder_transfer',
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [os.getenv("DRIVE_ROOT_ID")]
    }
    
    try:
        file = drive_client.service.files().create(
            body=file_metadata,
            fields='id'
        ).execute()
        file_id = file.get('id')
        print(f"✅ Carpeta creada: {file_id}")

        # 2. Intentar transferencia LOUDLY
        target_email = "residencia.incn@gmail.com"
        print(f"🔄 Intentando transferir propiedad a {target_email}...")
        
        try:
            new_permission = {
                'type': 'user',
                'role': 'owner',
                'emailAddress': target_email
            }
            
            drive_client.service.permissions().create(
                fileId=file_id,
                body=new_permission,
                transferOwnership=True,
                fields='id'
            ).execute()
            print("🚀 ¡INCREÍBLE! La transferencia de carpeta funcionó.")
            
        except Exception as transfer_error:
            print(f"❌ FALLO EN TRANSFERENCIA: {transfer_error}")
            
    except Exception as e:
        print(f"❌ Error al crear la carpeta: {e}")

if __name__ == "__main__":
    asyncio.run(test_transfer_failure())
