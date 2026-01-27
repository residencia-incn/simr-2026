from database import SessionLocal
from models import User, Transaction, FinancialRecord, Income, FinancialTransaction, PaymentTransaction, Budget

def count_rows():
    db = SessionLocal()
    try:
        print("--- CONTEO DE DATOS EN BD ---")
        
        users_count = db.query(User).count()
        print(f"Usuarios: {users_count}")
        
        trans_count = db.query(Transaction).count()
        print(f"Transacciones (Inscripciones): {trans_count}")
        
        fin_rec_count = db.query(FinancialRecord).count()
        print(f"Registros Financieros (V1): {fin_rec_count}")
        
        # Check breakdown of FinancialRecords
        if fin_rec_count > 0:
            incomes = db.query(FinancialRecord).filter(FinancialRecord.type == 'INSCRIPCION').count()
            expenses = db.query(FinancialRecord).filter(FinancialRecord.type != 'INSCRIPCION').count()
            print(f"  - Ingresos (Inscripciones): {incomes}")
            print(f"  - Otros: {expenses}")

        ft_count = db.query(FinancialTransaction).count()
        print(f"Transacciones Financieras (V2?): {ft_count}")
        
        pay_trans_count = db.query(PaymentTransaction).count()
        print(f"Payment Transactions (Vouchers): {pay_trans_count}")

        income_count = db.query(Income).count()
        print(f"Ingresos (Real Cash): {income_count}")
        
        budget_count = db.query(Budget).count()
        print(f"Presupuestos: {budget_count}")

    except Exception as e:
        print(f"Error al conectar o consultar: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    count_rows()
