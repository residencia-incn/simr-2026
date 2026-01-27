import sys
import os

# Add backend to path to import models and database
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def seed_roles():
    db = SessionLocal()
    try:
        # Core roles to seed
        roles_to_seed = [
            {
                "slug": "asistente",
                "name": "Asistente",
                "description": "Participante general del evento.",
                "default_modules": ["mi_perfil"],
                "mandatory_modules": ["mi_perfil"]
            },
            {
                "slug": "organizador",
                "name": "Organizador",
                "description": "Miembro del comité organizador con acceso a gestión.",
                "default_modules": ["organizacion", "contabilidad", "secretaria", "mi_perfil"],
                "mandatory_modules": ["organizacion", "contabilidad", "secretaria"]
            },
            {
                "slug": "ponente",
                "name": "Ponente",
                "description": "Expositor o conferencista.",
                "default_modules": ["academico", "mi_perfil"],
                "mandatory_modules": ["mi_perfil"]
            },
            {
                "slug": "jurado",
                "name": "Jurado",
                "description": "Calificador de trabajos de investigación.",
                "default_modules": ["jurado", "mi_perfil"],
                "mandatory_modules": ["jurado"]
            }
        ]

        print("Seeding role profiles...")
        for role_data in roles_to_seed:
            # Check if role already exists by slug
            existing_role = db.query(models.RoleProfile).filter(models.RoleProfile.slug == role_data["slug"]).first()
            
            if existing_role:
                print(f"Updating existing role: {role_data['slug']}")
                existing_role.name = role_data["name"]
                existing_role.description = role_data["description"]
                existing_role.default_modules = role_data["default_modules"]
                existing_role.mandatory_modules = role_data["mandatory_modules"]
            else:
                print(f"Creating new role: {role_data['slug']}")
                new_role = models.RoleProfile(
                    slug=role_data["slug"],
                    name=role_data["name"],
                    description=role_data["description"],
                    default_modules=role_data["default_modules"],
                    mandatory_modules=role_data["mandatory_modules"]
                )
                db.add(new_role)
        
        db.commit()
        print("Successfully seeded roles.")

    except Exception as e:
        print(f"Error seeding roles: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_roles()
