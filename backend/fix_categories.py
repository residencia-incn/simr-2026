from database import SessionLocal
import models

def update_workshop_categories():
    db = SessionLocal()
    try:
        # Buscar ingresos que sean de talleres pero tengan categoría Inscripciones
        workshops = db.query(models.Income).filter(
            models.Income.concept.like("Taller:%"),
            models.Income.category == "Inscripciones"
        ).all()
        
        print(f"Encontrados {len(workshops)} registros de talleres mal categorizados.")
        
        for ws in workshops:
            ws.category = "Talleres"
            
        db.commit()
        print("¡Categorías actualizadas correctamente!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_workshop_categories()
