from sqlalchemy import create_session
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import models
import datetime
from decimal import Decimal

# Postgres connection (assuming standard local for this project based on contexts)
engine = create_engine("postgresql://postgres:postgres@localhost:5432/simr_2026")
Session = sessionmaker(bind=engine)
db = Session()

def test_init():
    try:
        # Check if config exists
        config = db.query(models.AccountingConfig).first()
        if not config:
            print("Creating default config...")
            config = models.AccountingConfig(
                year=2026,
                monthly_fee=Decimal("100.00"),
                payment_deadline_day=29,
                start_month=datetime.date(2026, 1, 1),
                end_month=datetime.date(2026, 6, 1)
            )
            db.add(config)
            db.commit()
        
        print(f"Config: {config.monthly_fee} / month")
        
        # Check organizers
        orgs = db.query(models.User).filter(models.User.eventRole == "organizador").all()
        print(f"Found {len(orgs)} organizers")
        
        # Check if contributions exist
        c_count = db.query(models.Contribution).count()
        print(f"Total contributions: {c_count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_init()
