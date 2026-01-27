import os
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from fastapi import UploadFile, HTTPException
from typing import List, Dict, Any

# Configuración desde variables de entorno (SEGURIDAD)
SCOPES = ['https://www.googleapis.com/auth/drive']
# El archivo de credenciales debe estar en la raíz de backend/
SERVICE_ACCOUNT_FILE = 'google_credentials.json' 

# ID de la carpeta raíz compartida donde se guardará todo
ROOT_FOLDER_ID = os.getenv("DRIVE_ROOT_ID") 

class DriveService:
    def __init__(self):
        # Intentar cargar las credenciales desde el archivo
        if not os.path.exists(SERVICE_ACCOUNT_FILE):
            print(f"⚠️ ADVERTENCIA: No se encontró {SERVICE_ACCOUNT_FILE} en {os.getcwd()}")
            # Intentar en la carpeta backend si estamos en la raíz del proyecto
            fallback = os.path.join("backend", SERVICE_ACCOUNT_FILE)
            if os.path.exists(fallback):
                self.creds_path = fallback
            else:
                self.service = None
                return
        else:
            self.creds_path = SERVICE_ACCOUNT_FILE

        try:
            creds = service_account.Credentials.from_service_account_file(
                self.creds_path, scopes=SCOPES
            )
            self.service = build('drive', 'v3', credentials=creds)
        except Exception as e:
            print(f"❌ Error al inicializar Drive API: {e}")
            self.service = None

    def list_files(self, folder_id: str = None) -> List[Dict[str, Any]]:
        """Lista archivos y carpetas dentro de un folder específico"""
        if not self.service: 
            raise HTTPException(status_code=500, detail="Servicio de Google Drive no inicializado")
        
        target_folder = folder_id if folder_id else os.getenv("DRIVE_ROOT_ID")
        if not target_folder:
            raise HTTPException(status_code=500, detail="ID de carpeta raíz no configurado")
        
        # Query para filtrar solo lo que está dentro de la carpeta y no está en papelera
        query = f"'{target_folder}' in parents and trashed = false"
        
        try:
            results = self.service.files().list(
                q=query,
                pageSize=100,
                fields="nextPageToken, files(id, name, mimeType, webViewLink, iconLink, thumbnailLink)"
            ).execute()
            
            items = results.get('files', [])
            
            # Procesamos para el frontend
            processed = []
            for item in items:
                is_folder = item['mimeType'] == 'application/vnd.google-apps.folder'
                processed.append({
                    "id": item['id'],
                    "name": item['name'],
                    "type": "FOLDER" if is_folder else "FILE",
                    "mimeType": item['mimeType'],
                    "link": item.get('webViewLink'),
                    "icon": item.get('iconLink')
                })
            
            # Ordenar: Carpetas primero, luego por nombre
            return sorted(processed, key=lambda x: (x['type'] != 'FOLDER', x['name']))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al listar archivos: {str(e)}")

    def create_folder(self, name: str, parent_id: str = None):
        """Crea una subcarpeta"""
        if not self.service:
            raise HTTPException(status_code=500, detail="Servicio de Google Drive no inicializado")
            
        parent = parent_id if parent_id else os.getenv("DRIVE_ROOT_ID")
        file_metadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent]
        }
        try:
            file = self.service.files().create(body=file_metadata, fields='id, name').execute()
            return file
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al crear carpeta: {str(e)}")

    async def upload_file(self, file: UploadFile, parent_id: str = None, use_drive: bool = False):
        """Sube un archivo físico a Drive opcionalmente y siempre guarda una copia local en archivo/"""
        # 1. Preparar Carpeta Local
        local_dir = "archivo"
        if not os.path.exists(local_dir):
            os.makedirs(local_dir, exist_ok=True)
            
        # Generar nombre único local para evitar colisiones
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = f"{timestamp}_{file.filename}"
        local_path = os.path.join(local_dir, safe_name)
        
        try:
            # Leemos el archivo una sola vez
            content = await file.read()
            
            # 2. Guardar Copia Local
            with open(local_path, "wb") as f:
                f.write(content)
            print(f"✅ Archivo guardado localmente en: {local_path}")

            # 3. Subir a Google Drive (SOLO si se solicita explícitamente y está inicializado)
            if use_drive and self.service:
                try:
                    parent = parent_id if parent_id else os.getenv("DRIVE_ROOT_ID")
                    file_metadata = {
                        'name': file.filename,
                        'parents': [parent]
                    }
                    
                    media = MediaIoBaseUpload(io.BytesIO(content), mimetype=file.content_type, resumable=True)
                    
                    new_file = self.service.files().create(
                        body=file_metadata,
                        media_body=media,
                        fields='id, name, webViewLink'
                    ).execute()
                    
                    # Agregamos la ruta local al objeto respuesta para debug/auditoría
                    new_file["local_path"] = local_path
                    return new_file
                except Exception as drive_error:
                    print(f"⚠️ Error subiendo a Drive (usando fallback local): {drive_error}")
                    # Si falla Drive pero queríamos usarlo, caemos al retorno local
            
            # Retorno por defecto: Información del archivo local
            return {
                "id": f"local_{timestamp}",
                "name": file.filename,
                "webViewLink": f"/archivo/{safe_name}", # Link relativo para servir estáticos
                "local_path": local_path
            }

        except Exception as e:
            error_detail = str(e)
            # Log to file for debugging
            with open("debug_log.txt", "a") as f:
                import traceback
                f.write(f"\n[{datetime.now()}] UPLOAD ERROR: {error_detail}\n")
                f.write(traceback.format_exc())
            print(f"❌ Error en proceso de subida (local/drive): {error_detail}")
            raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {error_detail}")

    def delete_file(self, file_id: str):
        """Mueve a la papelera"""
        if not self.service:
            raise HTTPException(status_code=500, detail="Servicio de Google Drive no inicializado")
        try:
            self.service.files().update(fileId=file_id, body={'trashed': True}).execute()
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al eliminar archivo: {str(e)}")

# Singleton
drive_client = DriveService()
