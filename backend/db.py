import sqlite3

#Define database file name
DATABASE = 'time_logger.db'

def init_db():
    #Conect to database file. If it doesn't exist, it will be created.
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create the 'tasks' table
    cursor.execute('''
        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY,
            task_name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration INTEGER
        );
    ''')
    
    #save changes and close the connection
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()