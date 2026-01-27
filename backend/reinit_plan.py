
import sys
import os
import requests

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def reinit_plan():
    db = SessionLocal()
    try:
        print("--- RE-INITIALIZING CONTRIBUTION PLAN (FILLING GAPS) ---")
        
        # 1. Get current config
        config = db.query(models.AccountingConfig).filter_by(is_active=True).first()
        if not config:
            print("No active config found.")
            return

        print(f"Config Year: {config.year}")
        print(f"Range: {config.start_month} to {config.end_month}")
        print(f"Fee: {config.monthly_fee}")

        # 2. Get organizers (using the new logic)
        all_users = db.query(models.User).all()
        organizers = []
        for u in all_users:
            if u.eventRole == "organizador":
                organizers.append(u)
            elif u.roles and isinstance(u.roles, list) and "organizador" in u.roles:
                organizers.append(u)
        
        print(f"Organizers found: {len(organizers)}")

        # 3. Iterate and create missing
        from datetime import date
        created_count = 0
        curr = config.start_month
        
        while curr <= config.end_month:
            for org in organizers:
                exists = db.query(models.Contribution).filter(
                    models.Contribution.user_id == org.id,
                    models.Contribution.month_date == curr
                ).first()
                
                if not exists:
                    print(f"Creating missing contribution for {org.firstName} - {curr}")
                    new_c = models.Contribution(
                        user_id=org.id,
                        month_date=curr,
                        amount=config.monthly_fee,
                        status=models.ContributionStatus.PENDING
                    )
                    db.add(new_c)
                    created_count += 1
            
            # Advance month
            if curr.month == 12:
                curr = date(curr.year + 1, 1, 1)
            else:
                curr = date(curr.year, curr.month + 1, 1)
        
        db.commit()
        print(f"Done. Created {created_count} new entries.")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reinit_plan()
