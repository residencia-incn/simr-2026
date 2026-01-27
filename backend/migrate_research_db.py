from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Manual fallback for dev
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/simr_2026"

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Migrating research_submissions table...")
        try:
            conn.execute(text("ALTER TABLE research_submissions ADD COLUMN title TEXT"))
            print("- Added column 'title'")
        except Exception as e:
            print(f"- Error adding 'title': {e}")
            
        try:
            conn.execute(text("ALTER TABLE research_submissions ADD COLUMN specialty VARCHAR"))
            print("- Added column 'specialty'")
        except Exception as e:
            print(f"- Error adding 'specialty': {e}")
        
        conn.commit()
        print("Migration finished.")

if __name__ == "__main__":
    migrate()
