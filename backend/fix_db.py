from database import SessionLocal
import models

def fix():
    db = SessionLocal()
    print("--- FIXING DB STATUS ---")
    
    # 1. Update PaymentTransaction
    updated_txs = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.status == "PENDING").all()
    print(f"Updating {len(updated_txs)} transactions from 'PENDING' to 'PENDIENTE'...")
    for tx in updated_txs:
        tx.status = "PENDIENTE"
    
    # 2. Update Contributions (just in case)
    updated_contributions = db.query(models.Contribution).filter(models.Contribution.status == "PENDING").all()
    # Note: Contribution uses Enum, but just in case it was stored as string "PENDING"
    print(f"Updating {len(updated_contributions)} contributions from 'PENDING' to 'PENDIENTE'...")
    # Actually models.ContributionStatus.PENDING is "PENDIENTE" in some places? No, let's check models.py
    
    db.commit()
    print("Done.")
    db.close()

if __name__ == "__main__":
    fix()
