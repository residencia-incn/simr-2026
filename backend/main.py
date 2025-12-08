import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials, firestore

app = FastAPI(title="SIMR 2026 API", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite local dev
    "http://localhost:3000",
    "https://simr-2026.web.app", # Example production domain
    "*" # Allow all for now, restrict in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firestore Initialization (Conditional for local dev without creds)
db = None
try:
    # In Google Cloud Run, default credentials are used automatically.
    # For local, set GOOGLE_APPLICATION_CREDENTIALS env var.
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': os.environ.get('GOOGLE_CLOUD_PROJECT', 'simr-2026'),
        })
    db = firestore.client()
    print("Firestore initialized successfully.")
except Exception as e:
    print(f"Warning: Firestore could not be initialized. Using mock data. Error: {e}")

# Models
class Work(BaseModel):
    id: str
    title: str
    author: str
    type: str
    specialty: str
    status: str

# Mock Data
MOCK_WORKS = [
  { 
    "id": "TRB-001", 
    "title": "Encefalitis Autoinmune: Serie de casos en INCN", 
    "author": "Dr. Juan Pérez (R2)", 
    "type": "Trabajo Original", 
    "specialty": "Neurología", 
    "status": "Aceptado"
  },
  { 
    "id": "TRB-002", 
    "title": "Moya Moya en paciente pediátrico", 
    "author": "Dra. Maria Lopez (R1)", 
    "type": "Reporte de Caso", 
    "specialty": "Neuropediatría", 
    "status": "En Evaluación"
  }
]

# In-memory storage for fallbacks (Stateful Mock)
mock_db = {
    "config": {},
    "hero_slides": []
}

@app.get("/")
def read_root():
    return {"message": "Welcome to SIMR 2026 API", "status": "running"}

@app.get("/works", response_model=List[Work])
def get_works():
    if db:
        try:
            works_ref = db.collection('works')
            docs = works_ref.stream()
            return [Work(**doc.to_dict(), id=doc.id) for doc in docs]
        except Exception as e:
            print(f"Error fetching from Firestore: {e}")
            return MOCK_WORKS
    return MOCK_WORKS

@app.post("/works", status_code=201)
def create_work(work: Work):
    if db:
        try:
            db.collection('works').document(work.id).set(work.dict())
            return {"message": "Work created successfully", "id": work.id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"message": "Work created (Mock)", "id": work.id}

# --- Configuration Endpoints ---

@app.get("/config")
def get_config():
    if db:
        try:
            doc = db.collection('settings').document('global_config').get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            print(f"Firestore config error: {e}")
    
    # Fallback to in-memory state or empty (frontend handles defaults)
    return mock_db["config"]

@app.post("/config")
def save_config(config: dict):
    # Update in-memory state first (for immediate consistency if DB fails)
    mock_db["config"] = config
    
    if db:
        try:
            db.collection('settings').document('global_config').set(config)
            return {"message": "Config saved to Firestore"}
        except Exception as e:
            print(f"Firestore save error: {e}")
            return {"message": "Config saved to Memory (DB Failed)"}
    
    return {"message": "Config saved to Memory"}

@app.get("/hero-slides")
def get_hero_slides():
    if db:
        try:
            docs = db.collection('hero_slides').stream()
            # Sort might be needed, here assume insertion order or manage an 'order' field
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"Firestore slides error: {e}")
            
    return mock_db["hero_slides"]

@app.post("/hero-slides")
def save_hero_slides(slides: List[dict]):
    mock_db["hero_slides"] = slides
    
    if db:
        try:
            # Batch write or delete all and rewrite is simpler for this list
            # For simplicity, we'll assume the client sends the full list
            batch = db.batch()
            
            # Delete existing (naive approach for sync)
            old_docs = db.collection('hero_slides').list_documents()
            for doc in old_docs:
                batch.delete(doc)
            
            # Write new
            collection = db.collection('hero_slides')
            for i, slide in enumerate(slides):
                # Use ID from slide or generate one
                doc_ref = collection.document(slide.get('id', f'slide_{i}'))
                batch.set(doc_ref, slide)
                
            batch.commit()
            return {"message": "Slides saved to Firestore"}
        except Exception as e:
            print(f"Firestore slides save error: {e}")
            return {"message": "Slides saved to Memory (DB Failed)"}
            
    return {"message": "Slides saved to Memory"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
