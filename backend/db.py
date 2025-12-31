import sqlite3

DATABASE_NAME = 'time_logger.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    # Enable foreign key support (SQLite disables this by default)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Work Types Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS work_types (
            w_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    ''')

    # 2. Projects Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            p_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            w_id INTEGER NOT NULL,
            FOREIGN KEY (w_id) REFERENCES work_types (w_id) ON DELETE CASCADE
        )
    ''')

    # 3. Tasks Table
    # Added start_time and end_time to support the modal editing
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            p_id INTEGER NOT NULL,
            w_id INTEGER NOT NULL,
            log_date TEXT NOT NULL,
            duration_minutes INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Pending',
            start_time TEXT,
            end_time TEXT,
            FOREIGN KEY (p_id) REFERENCES projects (p_id) ON DELETE CASCADE,
            FOREIGN KEY (w_id) REFERENCES work_types (w_id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print(f"Database '{DATABASE_NAME}' initialized successfully with foreign key support.")