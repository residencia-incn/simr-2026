from database import SessionLocal
import models
from models_research import ResearchFile

def check_files():
    db = SessionLocal()
    try:
        print("\n--- Research Files ---")
        files = db.query(ResearchFile).all()
        for f in files:
            print(f"ID: {f.id}, SubmissionID: {f.submission_id}, Type: {f.file_type}, Status: {f.status}, Version: {f.version}, Path: {f.file_path}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_files()
