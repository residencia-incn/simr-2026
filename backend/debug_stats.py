import sys
import os
# Add current directory to path so we can import models/database
sys.path.append(os.getcwd())

from database import SessionLocal
import models
from sqlalchemy import func
from decimal import Decimal

db = SessionLocal()

print("Testing Income query...")
try:
    # Check if attribute exists
    if not hasattr(models, 'Income'):
        print("ERROR: models.Income does not exist!")
    else:
        total_income = db.query(func.sum(models.Income.amount)).scalar()
        print(f"Income: {total_income}")
except Exception as e:
    print(f"Income Failed: {e}")
    import traceback
    traceback.print_exc()

print("Testing Expenses query...")
try:
    total_expenses = db.query(func.sum(models.Transaction.total_amount))\
        .filter(models.Transaction.status == "approved")\
        .scalar()
    print(f"Expenses: {total_expenses}")
except Exception as e:
    print(f"Expenses Failed: {e}")
    import traceback
    traceback.print_exc()

print("Testing Penalties...")
try:
    all_penalties = db.query(models.Penalty).all()
    print(f"Penalties count: {len(all_penalties)}")
except Exception as e:
    print(f"Penalties Failed: {e}")

print("Testing Expense Distribution logic...")
try:
    approved_expenses = db.query(models.Transaction).filter(
        models.Transaction.status == "approved", 
        models.Transaction.total_amount > 0
    ).all()
    print(f"Approved expenses: {len(approved_expenses)}")
    for tx in approved_expenses:
        # Simulate the logic
        snapshot = tx.items_snapshot
        if snapshot:
            pass
except Exception as e:
    print(f"Expense Dist Failed: {e}")
    import traceback
    traceback.print_exc()

print("Done.")
