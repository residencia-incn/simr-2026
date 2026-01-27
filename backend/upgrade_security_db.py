from database import engine, Base
from sqlalchemy import text
from models_academic import EvaluationBackup

def upgrade_db():
    print("Upgrading database security schema...")
    with engine.connect() as conn:
        # 1. Add signature column to jury_assignments if not exists
        try:
            conn.execute(text("ALTER TABLE jury_assignments ADD COLUMN signature VARCHAR(64)"))
            conn.commit()
            print("Added 'signature' column to jury_assignments.")
        except Exception as e:
            print(f"Skipping column add (probably exists): {e}")

        # 2. Create evaluation_backups table
        # We rely on SQLAlchemy to create the table if it doesn't exist
        
    print("Creating missing tables...")
    Base.metadata.create_all(bind=engine)
    print("Database upgrade complete.")

if __name__ == "__main__":
    upgrade_db()
