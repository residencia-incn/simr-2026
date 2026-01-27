from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from os import getenv

# --- CONFIGURACIÓN DE SEGURIDAD ---
# 🚨 REGLA: Nunca hardcodear secretos. Leer de variables de entorno.
SECRET_KEY = getenv("SECRET_KEY", "super_secreto_cambiar_esto_en_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 horas

import bcrypt

# Función 1: Verificar si la contraseña plana coincide con el Hash de la DB
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Función 2: Generar el Hash (para cuando crees usuarios nuevos)
def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Función 3: Crear el Token JWT (La "Credencial de Acceso")
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
