import sqlite3
import os

DB_PATH = "backend/data/predictions.db"

if os.path.exists(DB_PATH):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM visitors ORDER BY registered_at DESC LIMIT 5;")
        rows = cursor.fetchall()
        print("Recent Visitors:")
        for row in rows:
            print(row)
        
        cursor.execute("SELECT COUNT(*) FROM visitors;")
        print("Total Visitors:", cursor.fetchone()[0])
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()
else:
    print("Database not found at", DB_PATH)
