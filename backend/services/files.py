import os
import shutil
from fastapi import UploadFile
from pathlib import Path

# Base upload directory relative to backend root
BASE_UPLOAD_DIR = Path("archivo")
SLIDES_DIR = BASE_UPLOAD_DIR / "diapositivas"

def ensure_directories():
    """Ensure upload directories exist."""
    SLIDES_DIR.mkdir(parents=True, exist_ok=True)

def save_research_slide(submission_id: str, file: UploadFile, version: int) -> str:
    """
    Save an uploaded slide file with versioning.
    Returns the relative path to store in DB.
    """
    ensure_directories()
    
    # Generate filename: TRB-001_v1_original.pdf -> TRB-001_v1.pdf (keep extension)
    extension = Path(file.filename).suffix
    if not extension:
        extension = ".pdf" # Default fallback
        
    filename = f"{submission_id}_v{version}{extension}"
    file_path = SLIDES_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return string path compatible with DB (relative to backend root usually)
    return str(file_path).replace("\\", "/") # Normalize for DB
