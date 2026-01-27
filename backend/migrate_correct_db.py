import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Using DATABASE_URL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Migrating research_submissions table in simr_db...")
        # Add title
        try:
            conn.execute(text("ALTER TABLE research_submissions ADD COLUMN title TEXT"))
            print("- Added column 'title'")
        except Exception as e:
            print(f"- Column 'title' probably exists: {e}")
            
        # Add specialty
        try:
            conn.execute(text("ALTER TABLE research_submissions ADD COLUMN specialty VARCHAR"))
            print("- Added column 'specialty'")
        except Exception as e:
            print(f"- Column 'specialty' probably exists: {e}")
            
        # Add is_late_submission
        try:
            conn.execute(text("ALTER TABLE research_submissions ADD COLUMN is_late_submission BOOLEAN DEFAULT FALSE"))
            print("- Added column 'is_late_submission'")
        except Exception as e:
            print(f"- Column 'is_late_submission' probably exists: {e}")
        
        conn.commit()
        print("Migration finished.")

if __name__ == "__main__":
    migrate()
