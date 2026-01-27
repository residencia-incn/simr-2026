
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
from sqlalchemy import text

def test_query():
    db = SessionLocal()
    try:
        print("Testing Incomes Query...")
        incomes = db.query(
            models.Income, 
            models.BankAccount, 
            models.FinancialInstitution,
            models.User
        ).outerjoin(
            models.BankAccount, models.Income.bank_account_id == models.BankAccount.id
        ).outerjoin(
            models.FinancialInstitution, models.BankAccount.institution_id == models.FinancialInstitution.id
        ).outerjoin(
            models.Transaction, models.Income.transaction_id == models.Transaction.id
        ).outerjoin(
            models.User, models.Transaction.user_id == models.User.id
        ).all()
        print(f"Incomes found: {len(incomes)}")

        print("Testing Financials Query...")
        financials = db.query(models.FinancialTransaction, models.BankAccount, models.FinancialInstitution, models.User)\
            .outerjoin(models.BankAccount, models.FinancialTransaction.bank_account_id == models.BankAccount.id)\
            .outerjoin(models.FinancialInstitution, models.BankAccount.institution_id == models.FinancialInstitution.id)\
            .outerjoin(models.User, models.FinancialTransaction.recorded_by_id == models.User.id)\
            .all()
        print(f"Financials found: {len(financials)}")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_query()
