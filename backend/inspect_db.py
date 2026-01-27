
from database import engine
from sqlalchemy import inspect

def check_schema():
    inspector = inspect(engine)
    print(f"DB Dialect: {engine.dialect.name}")
    print(f"DB URL: {engine.url}")
    
    for table in ["contributions", "penalties"]:
        print(f"\n--- Checking table: {table} ---")
        if inspector.has_table(table):
            cols = [c['name'] for c in inspector.get_columns(table)]
            print(f"Columns: {cols}")
        else:
            print("❌ Table NOT FOUND")

if __name__ == "__main__":
    check_schema()
