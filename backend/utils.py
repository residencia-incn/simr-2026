from datetime import datetime, timezone, timedelta
import shutil
import os
from uuid import uuid4
from fastapi import UploadFile
import bcrypt

def get_peru_time():
    """Retorna la fecha y hora actual en la zona horaria de Perú (UTC-5)."""
    return datetime.now(timezone(timedelta(hours=-5)))

UPLOAD_DIR = os.path.join("archivo", "vouchers")

def save_voucher_file(file: UploadFile, dni: str) -> str:
    """
    Guarda el archivo y retorna la URL relativa para la BD.
    Nombre formato: {DNI}_{RANDOM}.{ext}
    """
    try:
        if not os.path.exists(UPLOAD_DIR):
             os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Obtener extensión (ej: .jpg)
        filename_orig = file.filename
        extension = filename_orig.split(".")[-1] if "." in filename_orig else "jpg"
        
        # Generar Código Único de Archivo
        unique_code = f"{dni}_{uuid4().hex[:6]}"
        new_filename = f"{unique_code}.{extension}"
        
        # Ruta física
        file_path = os.path.join(UPLOAD_DIR, new_filename)
        
        # Guardado Físico
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Retornar la URL pública (ajusta el puerto si es necesario o usa variable de entorno)
        # Guardamos la ruta relativa para ser flexible
        return f"/vouchers/{new_filename}"
        
    except Exception as e:
        print(f"Error guardando voucher: {e}")
        return None

def hash(password: str):
    print(f"DEBUG_HASH_INPUT: '{password}' (len: {len(password)})")
    # Usar bcrypt nativo para evitar error de passlib/72 bytes
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify(plain_password, hashed_password):
    if not hashed_password: return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def delete_file_from_disk(file_url: str):
    """
    Elimina físicamente el archivo basado en su URL relativa.
    Ej: /vouchers/12345678_abcdef.jpg -> deleted
    """
    try:
        # Extraer solo el nombre del archivo
        filename = file_url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Error borrando voucher: {e}")
        return False
