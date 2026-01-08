import sqlite3

DATABASE_NAME = 'time_logger.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            reset_token TEXT,
            reset_token_expiry TEXT
        )
    ''')

    # 2. Work Types Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS work_types (
            w_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    # 3. Projects Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            p_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            w_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (w_id) REFERENCES work_types (w_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    # 4. Tasks Table 
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            log_date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            duration_minutes INTEGER DEFAULT 0,
            p_id INTEGER NOT NULL,
            w_id INTEGER NOT NULL,
            status TEXT DEFAULT 'Pending',
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (p_id) REFERENCES projects (p_id),
            FOREIGN KEY (w_id) REFERENCES work_types (w_id)
        )
    ''')
    
    # --- MIGRATION CHECK: Add columns if table already existed ---
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
        cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expiry TEXT")
        print("Columns added to existing database.")
    except sqlite3.OperationalError:
        # This error means the columns already exist, which is fine!
        pass

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print(f"Database '{DATABASE_NAME}' initialized successfully")