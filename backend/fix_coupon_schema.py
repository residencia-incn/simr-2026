import psycopg2
import os

DATABASE_URL = "postgresql://usuario_medico:password123@localhost:5432/simr_db"

def migrate():
    print("🚀 Iniciando migración de esquema de cupones...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Agregar columnas a 'coupons' si no existen
        print("  - Verificando columnas en 'coupons'...")
        cur.execute("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS group_tag VARCHAR;")
        cur.execute("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS created_by VARCHAR;")
        
        # 2. Crear tabla 'coupon_usages'
        print("  - Verificando tabla 'coupon_usages'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS coupon_usages (
                id SERIAL PRIMARY KEY,
                coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
                user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
                used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Migración completada exitosamente.")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate()
