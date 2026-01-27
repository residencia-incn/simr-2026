import sys
import os
import json

# Add backend to path to import models and database
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from database import SessionLocal
import models

def migrate_module_ids():
    db = SessionLocal()
    try:
        print("Starting data migration: agenda -> asistencia ...")
        
        # 1. Migrate RoleProfiles
        print("Updating RoleProfiles...")
        roles = db.query(models.RoleProfile).all()
        for role in roles:
            changed = False
            
            # Default modules
            if role.default_modules and 'agenda' in role.default_modules:
                role.default_modules = [m if m != 'agenda' else 'asistencia' for m in role.default_modules]
                print(f"  Updated default_modules for role: {role.slug}")
                changed = True
            
            # Mandatory modules
            if role.mandatory_modules and 'agenda' in role.mandatory_modules:
                role.mandatory_modules = [m if m != 'agenda' else 'asistencia' for m in role.mandatory_modules]
                print(f"  Updated mandatory_modules for role: {role.slug}")
                changed = True
            
            # Special case for 'ponente': replace 'agenda' with 'academico' if missed or 'asistencia'
            if role.slug == 'ponente':
                if 'asistencia' in (role.default_modules or []):
                    # For speakers, they shouldn't have 'asistencia' (admission) usually, they need 'academico'
                    role.default_modules = [m if m != 'asistencia' else 'academico' for m in role.default_modules]
                    print(f"  Redirected 'ponente' from 'asistencia' to 'academico'")
                    changed = True

            if changed:
                db.add(role)

        # 2. Migrate Users
        print("Updating Users...")
        users = db.query(models.User).all()
        for user in users:
            if user.modules and 'agenda' in user.modules:
                user.modules = [m if m != 'agenda' else 'asistencia' for m in user.modules]
                
                # Special heal for speakers in user data
                is_ponente = (user.roles and 'ponente' in user.roles) or user.eventRole == 'ponente'
                if is_ponente and 'asistencia' in user.modules:
                    user.modules = [m if m != 'asistencia' else 'academico' for m in user.modules]
                    # Ensure uniqueness
                    user.modules = list(set(user.modules))
                
                db.add(user)
                print(f"  Updated modules for user: {user.email}")

        db.commit()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_module_ids()
