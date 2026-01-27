from database import engine
from sqlalchemy import text
import sys

def migrate():
    print("🚀 Iniciando migración de Roles y Prioridades...")
    
    with engine.connect() as conn:
        # 1. Añadir columna priority a role_profiles
        print("Step 1/3: Añadiendo columna 'priority' a 'role_profiles'...")
        try:
            conn.execute(text("ALTER TABLE role_profiles ADD COLUMN priority INTEGER DEFAULT 99 NOT NULL"))
            conn.commit()
            print("✅ Columna 'priority' añadida.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("ℹ️ La columna 'priority' ya existe. Saltando...")
            else:
                print(f"❌ Error al añadir columna: {e}")
            conn.rollback()

        # 2. Asignar prioridades según lógica de negocio
        print("Step 2/3: Actualizando prioridades de roles conocidos...")
        priorities = {
            "organizador": 1,
            "jurado": 2,
            "ponente": 5,
            "asistente": 10,
            "participante": 10
        }
        
        for slug, p in priorities.items():
            result = conn.execute(text("UPDATE role_profiles SET priority = :p WHERE slug = :s"), {"p": p, "s": slug})
            if result.rowcount > 0:
                print(f"   - {slug}: Prioridad {p}")
        
        conn.commit()
        print("✅ Prioridades actualizadas.")

        # 3. Inicializar array de roles para usuarios existentes
        print("Step 3/3: Inicializando array 'roles' para usuarios antiguos...")
        try:
            # En Postgres, usamos jsonb_build_array o simplemente el formato string si es JSON
            # Chequeamos si la columna 'roles' es nula o está vacía y la llenamos con el 'eventRole'
            init_query = text("""
                UPDATE users 
                SET roles = jsonb_build_array("eventRole") 
                WHERE (roles IS NULL OR roles = '[]'::jsonb OR jsonb_array_length(roles) = 0) 
                AND "eventRole" IS NOT NULL 
                AND "eventRole" != ''
            """)
            result = conn.execute(init_query)
            conn.commit()
            print(f"✅ Se inicializaron roles para {result.rowcount} usuarios.")
        except Exception as e:
            print(f"⚠️ Error al inicializar array de roles (posiblemente no es Postgres o falta jsonb): {e}")
            conn.rollback()
            
            # Fallback más genérico si falla lo anterior
            print("Intentando fallback genérico para inicialización de roles...")
            try:
                conn.execute(text("UPDATE users SET roles = '[]' WHERE roles IS NULL"))
                conn.commit()
                print("✅ Fallback completado (roles inicializados como array vacío).")
            except:
                conn.rollback()

        # 4. Sincronizar legacy eventRole en el array roles (si falta)
        print("Step 4/6: Sincronizando legacy 'eventRole' en array 'roles'...")
        try:
            sync_query = text("""
                UPDATE users 
                SET roles = roles || jsonb_build_array("eventRole") 
                WHERE "eventRole" IS NOT NULL 
                AND "eventRole" != '' 
                AND NOT (roles @> jsonb_build_array("eventRole"))
            """)
            result = conn.execute(sync_query)
            conn.commit()
            print(f"✅ Se sincronizaron legacy roles para {result.rowcount} usuarios.")
        except Exception as e:
            print(f"⚠️ Error al sincronizar legacy roles: {e}")
            conn.rollback()

        # 5. Normalizar 'participante' a 'asistente' en el array de roles
        print("Step 5/6: Normalizando roles ('participante' -> 'asistente')...")
        try:
            normalize_query = text("""
                UPDATE users 
                SET roles = (
                    SELECT jsonb_agg(CASE WHEN elem = 'participante' THEN 'asistente' ELSE elem END)
                    FROM jsonb_array_elements_text(users.roles) AS elem
                )
                WHERE roles ? 'participante'
            """)
            result = conn.execute(normalize_query)
            conn.commit()
            print(f"✅ Se normalizaron roles para {result.rowcount} usuarios.")
        except Exception as e:
            print(f"⚠️ Error al normalizar roles: {e}")
            conn.rollback()

        # 6. Deduplicar roles
        print("Step 6/6: Deduplicando roles...")
        try:
            dedup_query = text("""
                UPDATE users 
                SET roles = (
                    SELECT jsonb_agg(DISTINCT elem)
                    FROM jsonb_array_elements_text(roles) AS elem
                )
                WHERE jsonb_typeof(roles) = 'array'
            """)
            result = conn.execute(dedup_query)
            conn.commit()
            print(f"✅ Se deduplicaron roles para todos los usuarios ({result.rowcount} filas procesadas).")
        except Exception as e:
            print(f"⚠️ Error al deduplicar roles: {e}")
            conn.rollback()

    print("🏁 Migración completada exitosamente.")

if __name__ == "__main__":
    migrate()
