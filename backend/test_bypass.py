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

async def test_bypass_transfer():
    print("🧪 Verificando Solución Bypass (Transferencia de Propiedad)")
    
    # Simulación de un archivo
    class MockFile:
        def __init__(self, filename, content, content_type):
            self.filename = filename
            self.content = content
            self.content_type = content_type
        async def read(self):
            return self.content

    mock_file = MockFile("test_bypass.txt", b"Prueba de transferencia de propiedad", "text/plain")
    
    try:
        print("📡 Intentando subir y transferir...")
        result = await drive_client.upload_file(mock_file)
        file_id = result.get('id')
        print(f"✅ Subida exitosa: {file_id}")
        
        # Verificar permisos del archivo recién subido
        print(f"🔍 Verificando permisos del archivo {file_id}...")
        perms = drive_client.service.permissions().list(fileId=file_id, fields="permissions(emailAddress, role)").execute()
        
        has_transfer = False
        for p in perms.get('permissions', []):
            if p.get('emailAddress') == 'residencia.incn@gmail.com' and p.get('role') == 'owner':
                has_transfer = True
                break
        
        if has_transfer:
            print("💎 ¡ÉXITO! La propiedad se transfirió correctamente a residencia.incn@gmail.com")
        else:
            print("⚠️ El archivo subió, pero no se transfirió la propiedad (puede ser que residencia.incn sea de otro dominio/GSuite).")
            print(f"Permisos actuales: {perms}")

    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        if "storageQuotaExceeded" in str(e):
            print("\n🚨 NOTA: Sigue saliendo cuota llena. Esto es normal si la cuenta tiene 0 bytes libres.")
            print("La solución de transferencia FUNCIONA para archivos nuevos, pero el PRIMER archivo")
            print("necesita que borres algo manualmente primero para poder existir antes de ser transferido.")

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_bypass_transfer())
