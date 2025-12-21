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

    # 2. Work Types (W01, W02...)
    cursor.execute('''
        CREATE TABLE work_types (
            w_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    ''')

    # 3. Projects (P01, P02...) 
    # Linked to a Work Type. A project cannot exist without a Work Type.
    cursor.execute('''
        CREATE TABLE projects (
            p_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            w_id INTEGER NOT NULL,
            FOREIGN KEY (w_id) REFERENCES work_types (w_id) ON DELETE CASCADE
        )
    ''')

    # 4. Tasks (T01, T02...)
    # Linked to a Project. This ensures T01 belongs to P01 and ONLY P01.
    cursor.execute('''
        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            log_date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_minutes INTEGER,
            status TEXT DEFAULT 'Pending',
            p_id INTEGER NOT NULL,
            w_id INTEGER NOT NULL,
            FOREIGN KEY (p_id) REFERENCES projects (p_id) ON DELETE CASCADE,
            FOREIGN KEY (w_id) REFERENCES work_types (w_id) ON DELETE CASCADE
        )
    ''')

    # Seed initial data based on your example
    cursor.execute("INSERT INTO work_types (name) VALUES ('W01'), ('W02')")
    cursor.execute("INSERT INTO projects (name, w_id) VALUES ('P01', 1), ('P02', 1), ('P03', 1)")
    
    conn.commit()
    conn.close()
    print("Database initialized with tables and seed data.")

if __name__ == '__main__':
    init_db()