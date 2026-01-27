import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

def fix_role_schema():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            print("🔧 Fixing role_profiles schema...")
            
            # 1. Drop Foreign Key Constraint (unknown name, so we try the default generated one or strict SQL)
            # SQLAlchemy usually generates `tablename_columnname_fkey`
            print("1. Dropping FK constraint if exists...")
            try:
                conn.execute(text("ALTER TABLE role_profiles DROP CONSTRAINT IF EXISTS role_profiles_default_modality_id_fkey"))
            except Exception as e:
                print(f"Warning dropping FK: {e}")

            # 2. Change Column Type to String (VARCHAR)
            print("2. Altering column type to VARCHAR...")
            conn.execute(text("ALTER TABLE role_profiles ALTER COLUMN default_modality_id TYPE VARCHAR USING default_modality_id::varchar"))

            trans.commit()
            print("✅ Schema updated successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Error updating schema: {e}")

if __name__ == "__main__":
    fix_role_schema()
