import firebase_admin
from firebase_admin import credentials, firestore
import os

# Patrón Singleton para no inicializar dos veces
def init_firebase():
    if not firebase_admin._apps:
        # El SDK de Admin detecta automáticamente FIRESTORE_EMULATOR_HOST
        # Si no estamos en emulador, buscamos la credencial.
        emulator_host = os.getenv("FIRESTORE_EMULATOR_HOST")
        
        if emulator_host:
            # En modo emulador con projectId configurado en env
            # No necesitamos certificado real, pero firebase-admin a veces lo pide
            # si no detecta el entorno correctamente.
            print(f"🔧 Conectando a Firebase Emulator: {emulator_host}")
            firebase_admin.initialize_app()
        else:
            # Opción segura para desarrollo local / producción:
            # Intentar cargar desde variable de entorno o archivo
            cert_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if cert_path and os.path.exists(cert_path):
                cred = credentials.Certificate(cert_path)
                firebase_admin.initialize_app(cred)
            else:
                # Fallback a Application Default Credentials (útil en Cloud Run)
                try:
                    firebase_admin.initialize_app()
                except Exception as e:
                    print(f"⚠️ Error inicializando Firebase: {e}")

def send_realtime_signal(collection: str, doc_id: str, data: dict):
    """
    Función auxiliar para enviar señales a Firestore sin afectar la lógica principal
    """
    try:
        db = firestore.client()
        # SERVER_TIMESTAMP es útil para sincronización
        if "timestamp" not in data:
            data["timestamp"] = firestore.SERVER_TIMESTAMP
            
        db.collection(collection).document(doc_id).set(data, merge=True)
        print(f"🔥 Señal enviada a Firebase: {collection}/{doc_id}")
    except Exception as e:
        print(f"⚠️ Error conectando con Firebase: {e}")
