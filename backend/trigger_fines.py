
import sys
import os
import random
from datetime import datetime, date

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def generate_test_penalties():
    db = SessionLocal()
    try:
        print("--- GENERATING TEST PENALTIES ---")
        
        # 1. Get a target user (organizer)
        # Using the one from the screenshot: Henderson Jheison Vasquez Armas
        # We need to find his ID. 
        user = db.query(models.User).filter(models.User.firstName.ilike("%Henderson%")).first()
        
        if not user:
            print("User Henderson not found. Picking first organizer...")
            user = db.query(models.User).filter(models.User.eventRole == "organizador").first()
            
        if not user:
            print("No organizer found.")
            return

        print(f"Target User: {user.firstName} {user.lastName} ({user.id})")

        # 2. Create Penalties
        penalties_data = [
            {"reason": "Tardanza: Reunion de Prueba 7", "amount": 10.00},
            {"reason": "Falta: Reunion Final Febrero", "amount": 20.00}
        ]

        created_count = 0
        for p in penalties_data:
            # Check if exists to avoid duplicates
            exists = db.query(models.Penalty).filter(
                models.Penalty.user_id == user.id,
                models.Penalty.concept == p["reason"]
            ).first()
            
            if not exists:
                new_penalty = models.Penalty(
                    id=random.randint(10000, 99999), 
                    user_id=user.id,
                    concept=p["reason"], # Map reason to concept
                    amount=p["amount"],
                    status="PENDING" 
                )
                db.add(new_penalty)
                created_count += 1
                print(f"Added penalty: {p['reason']} (ID: {new_penalty.id})")
            else:
                print(f"Penalty already exists: {p['reason']}")

        db.commit()
        print(f"Done. Created {created_count} new penalties.")

    except Exception as e:
        print(f"ERROR: {e}")
        # Try to print more detail
        if hasattr(e, 'orig'):
             print(f"PG Code: {e.orig.pgcode}")
             print(f"PG Error: {e.orig.pgerror}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    generate_test_penalties()
