import models
from database import engine

def reset_db():
    print("Eliminando tablas existentes...")
    models.Base.metadata.drop_all(bind=engine)
    print("Recreando tablas con el nuevo esquema...")
    models.Base.metadata.create_all(bind=engine)
    print("¡Base de datos reseteada con éxito!")

if __name__ == "__main__":
    reset_db()
