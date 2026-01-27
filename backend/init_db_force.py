from database import engine, Base
import models

print("Creando tablas faltantes...")
Base.metadata.create_all(bind=engine)
print("Tablas verificadas.")
