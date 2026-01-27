from database import engine, Base
import models
from sqlalchemy import text

def run_migration():
    print("Running Coupon Refinement Migration...")
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. discount_type
            conn.execute(text("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR DEFAULT 'PERCENTAGE'"))
            # 2. discount_value
            conn.execute(text("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_value INTEGER DEFAULT 100"))
            # 3. target_modules
            conn.execute(text("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS target_modules JSON DEFAULT '[]'"))
            
            trans.commit()
            print("Migration successful! New columns added.")
        except Exception as e:
            trans.rollback()
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    run_migration()
