from database import engine, Base
from models import CommitteeMember, Committee
from sqlalchemy import text

# Drop tables to force schema update
print("Dropping committee tables...")
try:
    CommitteeMember.__table__.drop(bind=engine, checkfirst=True)
    Committee.__table__.drop(bind=engine, checkfirst=True)
    print("Tables dropped.")
except Exception as e:
    print(f"Error dropping tables: {e}")

# Recreate tables immediately
print("Recreating tables...")
Base.metadata.create_all(bind=engine)
print("Tables recreated.")

# Seed Data
from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

groups = [
    {"name": "Junta Directiva", "order": 1, "description": "Liderazgo principal del evento"},
    {"name": "Comité Científico", "order": 2, "description": "Encargados del programa académico"},
    {"name": "Comité de Ética", "order": 3, "description": "Supervisión normativa"},
    {"name": "Logística", "order": 4, "description": "Organización operativa"},
    {"name": "Auspicios y Relaciones", "order": 5, "description": "Gestión de partners"},
]

for g in groups:
    exists = db.query(Committee).filter_by(name=g['name']).first()
    if not exists:
        new_g = Committee(**g)
        db.add(new_g)

db.commit()
print("Seed data inserted.")
db.close()
