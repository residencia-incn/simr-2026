import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from database import SessionLocal, engine
from sqlalchemy import text

def fix_schema():
    print("Fixing database schema...")
    with engine.connect() as conn:
        try:
            # Check all columns for debugging
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'"))
            columns = [row[0] for row in result.fetchall()]
            print(f"Current columns in 'users': {columns}")
            
            if 'roles' not in columns:
                print("Adding 'roles' column to 'users' table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN roles JSONB DEFAULT '[\"asistente\"]'"))
                # In SQLAlchemy 2.0+ we need to commit
                conn.execute(text("COMMIT"))
                print("Column 'roles' added successfully.")
            else:
                print("Column 'roles' already exists.")
        except Exception as e:
            print(f"Error: {e}")
            try:
                conn.execute(text("ROLLBACK"))
            except:
                pass

if __name__ == "__main__":
    fix_schema()
