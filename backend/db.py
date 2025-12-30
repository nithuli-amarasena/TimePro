import sqlite3

DATABASE = 'time_logger.db'

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Enable Foreign Key support in SQLite
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Clear everything to start fresh
    cursor.execute('DROP TABLE IF EXISTS tasks')
    cursor.execute('DROP TABLE IF EXISTS projects')
    cursor.execute('DROP TABLE IF EXISTS work_types')

    # 2. Work Types (Top level)
    cursor.execute('''
        CREATE TABLE work_types (
            w_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    ''')

    # 3. Projects (Linked to Work Type)
    cursor.execute('''
        CREATE TABLE projects (
            p_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            w_id INTEGER NOT NULL,
            FOREIGN KEY (w_id) REFERENCES work_types (w_id) ON DELETE CASCADE
        )
    ''')

    # 4. Tasks (Linked to Project and Work Type)
    # Changed: start_time and end_time are now optional (removed NOT NULL)
    cursor.execute('''
        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            log_date TEXT NOT NULL,
            start_time TEXT, 
            end_time TEXT,
            duration_minutes INTEGER,
            status TEXT DEFAULT 'Pending',
            p_id INTEGER NOT NULL,
            w_id INTEGER NOT NULL,
            FOREIGN KEY (p_id) REFERENCES projects (p_id) ON DELETE CASCADE,
            FOREIGN KEY (w_id) REFERENCES work_types (w_id) ON DELETE CASCADE
        )
    ''')

    # Seed initial data
    cursor.execute("INSERT INTO work_types (name) VALUES ('Development'), ('Meetings')")
    
    # Development Projects
    cursor.execute("INSERT INTO projects (name, w_id) VALUES ('Project Alpha', 1), ('Project Beta', 1)")
    # Meeting Projects
    cursor.execute("INSERT INTO projects (name, w_id) VALUES ('Daily Standup', 2)")
    
    conn.commit()
    conn.close()
    print("🚀 Database initialized with Cascade Delete enabled.")

if __name__ == '__main__':
    init_db()