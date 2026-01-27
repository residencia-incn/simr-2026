import sqlite3

def migrate():
    print("Migrating meeting_attendance...")
    conn = sqlite3.connect('simr_local.db')
    cursor = conn.cursor()
    
    try:
        # Add attributes column if missing
        cursor.execute("ALTER TABLE meeting_attendance ADD COLUMN justification_reason TEXT")
        print("Added justification_reason column.")
    except Exception as e:
        print(f"justification_reason error (maybe exists): {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
