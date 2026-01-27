from database import SessionLocal
from models_research import ResearchFile

def fix_paths():
    db = SessionLocal()
    try:
        files = db.query(ResearchFile).filter(ResearchFile.file_path.like("archivos%")).all()
        print(f"Found {len(files)} files with old path 'archivos/'")
        
        for f in files:
            old_path = f.file_path
            new_path = old_path.replace("archivos", "archivo", 1) # Replace first occurrence
            f.file_path = new_path
            print(f"Updated: {old_path} -> {new_path}")
            
        db.commit()
        print("Migration complete.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_paths()
