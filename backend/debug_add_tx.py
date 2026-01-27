import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import utils
from datetime import datetime

def debug_transaction():
    db = SessionLocal()
    print("Iniciando prueba de inserción de transacción...")
    
    try:
        # Mocking data similar to what the frontend sends
        descripcion = "Prueba de Egreso Debug"
        monto = -50.0
        categoria = "Otros"
        cuenta_id = 1
        type = "expense"
        fecha = "2026-01-16"
        
        # Get a real user ID from the database
        user = db.query(models.User).first()
        if not user:
            print("❌ No hay usuarios en la base de datos para la prueba")
            return
        
        print(f"Usando usuario: {user.id}")
        
        # Verify if account exists
        account = db.query(models.BankAccount).filter_by(id=cuenta_id).first()
        if not account:
            print(f"⚠️ Cuenta {cuenta_id} no existe, creando una temporal...")
            new_acc = models.BankAccount(id=cuenta_id, alias="Cuenta Debug", currency="PEN", holder_name="Debug")
            db.add(new_acc)
            db.commit()
            db.refresh(new_acc)
        
        print("Intentando crear objeto FinancialTransaction...")
        new_ft = models.FinancialTransaction(
            description=descripcion,
            amount=monto,
            category=categoria,
            type=type,
            bank_account_id=cuenta_id,
            voucher_url=None,
            recorded_by_id=user.id,
            date=datetime.fromisoformat(fecha)
        )
        
        print("Añadiendo a la sesión...")
        db.add(new_ft)
        
        print("Intentando commit...")
        db.commit()
        print("✅ Transacción creada exitosamente en DB.")
        
    except Exception as e:
        print("\n❌ CRASH DETECTADO:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_transaction()
