from database import SessionLocal
import models

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(models.RegistrationModality).count() > 0:
            print("✅ Modalidades ya sembradas.")
        else:
            modalities = [
                models.RegistrationModality(code="t_presencial_full", title="Presencial FULL", price=350, description="Acceso total presencial con certificado"),
                models.RegistrationModality(code="t_presencial_estudiante", title="Presencial Estudiante", price=250, description="Acceso presencial para estudiantes"),
                models.RegistrationModality(code="t_virtual", title="Virtual (Sin Certificado)", price=150, description="Acceso virtual a las ponencias"),
                models.RegistrationModality(code="t_virtual_certificado", title="Virtual (Con Certificado)", price=200, description="Acceso virtual con certificación")
            ]
            db.add_all(modalities)
            print("✅ Modalidades sembradas.")

        # Seed workshops into SystemConfig if empty
        config = db.query(models.SystemConfig).filter(models.SystemConfig.id == 1).first()
        if not config:
            config = models.SystemConfig(id=1)
            db.add(config)
        
        if not config.workshops or len(config.workshops) == 0:
            config.workshops = [
                {"id": "w_neuro", "name": "Taller de Neuroanatomía", "price": 100},
                {"id": "w_radiologia", "name": "Taller de Radiología", "price": 80},
                {"id": "w_simulacion", "name": "Simulación Clínica", "price": 120}
            ]
            print("✅ Talleres sembrados en SystemConfig.")
        else:
             print("✅ Talleres ya existen en SystemConfig.")

        db.commit()
    except Exception as e:
        print(f"❌ Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
