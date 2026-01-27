import sqlite3

def migrate():
    conn = sqlite3.connect('simr_local.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE system_config ADD COLUMN registration_modalities JSON DEFAULT '[]'")
        print("Added registration_modalities column.")
    except Exception as e:
        print(f"registration_modalities error (maybe exists): {e}")

    try:
        cursor.execute("ALTER TABLE system_config ADD COLUMN workshops JSON DEFAULT '[]'")
        print("Added workshops column.")
    except Exception as e:
        print(f"workshops error (maybe exists): {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
