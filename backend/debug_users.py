from database import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        res = conn.execute(text('SELECT id, "eventRole", roles FROM users')).fetchall()
        for r in res:
            print(f"ID: {r.id} | eventRole: {r.eventRole} | roles: {r.roles}")

if __name__ == "__main__":
    check()
