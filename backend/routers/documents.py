from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Any
from services.drive_service import drive_client
import oauth2


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

@router.get("/list")
async def list_documents(folder_id: Optional[str] = None, current_user = Depends(oauth2.get_current_user)):
    """Obtiene el contenido de una carpeta en Google Drive"""
    try:
        return drive_client.list_files(folder_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/folder")
async def create_new_folder(
    data: FolderCreate, 
    current_user = Depends(oauth2.get_current_user)
):
    """Crea una nueva carpeta en Google Drive"""
    try:
        return drive_client.create_folder(data.name, data.parent_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_new_file(
    file: UploadFile = File(...), 
    parent_id: Optional[str] = Form(None),
    current_user = Depends(oauth2.get_current_user)
):
    """Sube un archivo a Google Drive"""
    try:
        return await drive_client.upload_file(file, parent_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{file_id}")
async def delete_document(file_id: str, current_user = Depends(oauth2.get_current_user)):
    """Elimina (mueve a la papelera) un archivo o carpeta en Google Drive"""
    try:
        return drive_client.delete_file(file_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
