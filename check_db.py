import sqlite3

conn = sqlite3.connect('backend/simr_local.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(system_config)")
columns = [info[1] for info in cursor.fetchall()]
print(f"Columns in system_config: {columns}")
conn.close()
