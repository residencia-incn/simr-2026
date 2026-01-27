import sys
import os

# Add current directory to python path
sys.path.append(os.getcwd())

from database import SessionLocal
from models import SystemConfig

def check_data():
    try:
        db = SessionLocal()
        config = db.query(SystemConfig).first()
        if config:
            print(f"Occupations: {config.allowed_occupations}")
            print(f"Residency Years: {config.residency_years}")
            print(f"Institutions: {config.allowed_institutions}")
            print(f"Specialties: {config.participant_specialties}")
        else:
            print("No system config found.")
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_data()
