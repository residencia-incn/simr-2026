from database import engine
from sqlalchemy import inspect

def check_schema():
    inspector = inspect(engine)
    columns = inspector.get_columns('incomes')
    print("Columns in 'incomes' table:")
    for c in columns:
        print(f"- {c['name']} ({c['type']})")

if __name__ == "__main__":
    check_schema()
