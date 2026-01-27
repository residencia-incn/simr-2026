from database import Base, engine
import models

print("Registered tables in metadata:")
for t in Base.metadata.tables:
    print(f" - {t}")

print("\nCreating specific table system_config...")
try:
    models.SystemConfig.__table__.create(bind=engine)
    print("Created system_config manually.")
except Exception as e:
    print(f"Error creating system_config: {e}")
