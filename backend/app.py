from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

# Define the database file path
DATABASE = 'time_logger.db'

# 1. Initialize the Flask application
app = Flask(__name__)
CORS(app) #This is crutial line 

# Helper function to connect to the DB
# The row_factory makes the results look like a dictionary (access columns by name)
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  
    return conn

# 2. Define a simple test route to ensure the server is running
@app.route('/')
def home():
    return 'Time Logger Backend is Running!'

# 3. Define the main API endpoint
@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    conn = get_db_connection()
    
    if request.method == 'POST':
        # 1. Get the JSON data sent from the frontend
        task_data = request.get_json()
        
        # 2. Extract the data fields
        task_name = task_data['task_name']

        title = task_data['title']
        start_time = task_data['start_time']
        end_time = task_data['end_time']
        
        # 3. Execute the correct SQL INSERT statement
        sql_query = "INSERT INTO tasks (task_name, start_time, end_time) VALUES (?, ?, ?)"
        
        conn.execute(sql_query, (task_name, start_time, end_time))
        
        # Commit saves the changes to the database permanently
        conn.commit() 
        conn.close()

        sql_query = "INSERT INTO tasks (title, start_time, end_time) VALUES (?, ?, ?)"
        
        conn.execute(sql_query, (title, start_time, end_time))
        
        # Commit saves the changes to the database permanently
        conn.commit() 
        conn.close()    

        # 4. Return a success message
        return jsonify({'message': 'Task created successfully!'}), 201

    if request.method == 'GET':
        # 1. Execute the SQL command
        cursor = conn.execute("SELECT * FROM tasks")
        
        # 2. Fetch all results
        tasks = cursor.fetchall() 
        conn.close()

        # 3. Convert the list of sqlite3.Row objects into a list of dictionaries.
        task_list = [dict(task) for task in tasks] 
        
        # 4. Return the list as a JSON response
        return jsonify(task_list), 200
    return 'Task API endpoint ready.', 200
    
# 4. Run the application
if __name__ == '__main__':
    # debug=True automatically restarts the server when you save changes
    app.run(debug=True)