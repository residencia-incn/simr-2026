import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_migration():
    columns = [
        ("title", "TEXT"),
        ("specialty", "VARCHAR"),
        ("is_late_submission", "BOOLEAN DEFAULT FALSE")
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in columns:
            try:
                print(f"Adding {col_name}...")
                conn.execute(text(f"ALTER TABLE research_submissions ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"✅ Column {col_name} added.")
            except Exception as e:
                conn.rollback()
                print(f"ℹ️ Column {col_name} already exists or error: {str(e)[:100]}...")

if __name__ == "__main__":
    run_migration()
