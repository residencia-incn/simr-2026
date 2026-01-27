from database import SessionLocal
from models import AccountingConfig, FinancialInstitution, TransactionCategory, BankAccount

def check_master_data():
    db = SessionLocal()
    try:
        print("--- MASTER DATA CHECK ---")
        
        acc_config = db.query(AccountingConfig).count()
        print(f"AccountingConfig: {acc_config}")
        
        banks = db.query(FinancialInstitution).count()
        print(f"FinancialInstitutions: {banks}")

        bank_accounts = db.query(BankAccount).count()
        print(f"BankAccounts: {bank_accounts}")
        
        cats = db.query(TransactionCategory).count()
        print(f"TransactionCategories: {cats}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_master_data()
