from database import SessionLocal
import models

def diag():
    db = SessionLocal()
    print("--- DIAGNÓSTICO DETALLADO ---")
    
    # 1. Payment Transactions
    txs = db.query(models.PaymentTransaction).all()
    print(f"Total PaymentTransactions in DB: {len(txs)}")
    
    for tx in txs:
        status_raw = tx.status
        user_id = tx.user_id
        user_obj = tx.user
        
        # Mostrar solo si parece pendiente
        if status_raw in ["PENDING", "PENDIENTE"]:
            print(f"ID: {tx.id} | Status: '{status_raw}' | UserID: {user_id} | VoucherURL: {tx.voucher_url}")
            if not user_obj:
                u_in_db = db.query(models.User).filter_by(id=user_id).first()
                print(f"   -> User {user_id} exists in DB? {'YES' if u_in_db else 'NO'}")

    # 2. Stats Test
    count_reg = db.query(models.RegistrationRequest).count()
    count_pay_es = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.status == "PENDIENTE").count()
    count_pay_en = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.status == "PENDING").count()
    
    print(f"\n--- RENDIMIENTO DE FILTROS ---")
    print(f"RegistrationRequests Count: {count_reg}")
    print(f"PaymentTransactions ('PENDIENTE') Count: {count_pay_es}")
    print(f"PaymentTransactions ('PENDING') Count: {count_pay_en}")
    
    db.close()

if __name__ == "__main__":
    diag()
