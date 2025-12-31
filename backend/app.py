from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)
DATABASE = 'time_logger.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.execute("PRAGMA foreign_keys = ON;") # Ensures deleting a Work Type deletes its Projects/Tasks
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def home():
    return jsonify({"status": "Backend is Running", "message": "API endpoints are active"})

# --- WORK TYPE ENDPOINTS ---
@app.route('/api/work-types', methods=['GET', 'POST'])
def work_types():
    conn = get_db_connection()
    if request.method == 'POST':
        name = request.json.get('name')
        cur = conn.execute("INSERT INTO work_types (name) VALUES (?)", (name,))
        new_w_id = cur.lastrowid
        conn.commit()
        return jsonify({'w_id': new_w_id, 'name': name}), 201
    
    rows = conn.execute("SELECT * FROM work_types").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/work-types/<int:w_id>', methods=['PUT', 'DELETE'])
def handle_work_type(w_id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM work_types WHERE w_id = ?", (w_id,))
        conn.commit()
        return jsonify({'message': 'Work Type Deleted'}), 200
    
    if request.method == 'PUT':
        data = request.json
        conn.execute("UPDATE work_types SET name = ? WHERE w_id = ?", (data['name'], w_id))
        conn.commit()
        return jsonify({'message': 'Work Type Updated'}), 200

# --- PROJECT ENDPOINTS ---
@app.route('/api/projects', methods=['GET', 'POST'])
def projects():
    conn = get_db_connection()
    w_id = request.args.get('w_id')
    
    if request.method == 'POST':
        data = request.json
        cur = conn.execute("INSERT INTO projects (name, w_id) VALUES (?, ?)", 
                           (data['name'], data['w_id']))
        new_p_id = cur.lastrowid
        conn.commit()
        return jsonify({'p_id': new_p_id, 'name': data['name'], 'w_id': data['w_id']}), 201

    query = "SELECT * FROM projects"
    params = ()
    if w_id:
        query += " WHERE w_id = ?"
        params = (w_id,)
        
    rows = conn.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/projects/<int:p_id>', methods=['PUT', 'DELETE'])
def handle_project(p_id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM projects WHERE p_id = ?", (p_id,))
        conn.commit()
        return jsonify({'message': 'Project Deleted'}), 200
    
    if request.method == 'PUT':
        data = request.json
        conn.execute("UPDATE projects SET name = ? WHERE p_id = ?", (data['name'], p_id))
        conn.commit()
        return jsonify({'message': 'Project Updated'}), 200

# --- TASK ENDPOINTS ---
@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        # Check if duration is provided or needs calculation
        duration = data.get('duration_minutes', 0)
        
        # Calculate duration if missing but times exist
        if not duration and data.get('start_time') and data.get('end_time'):
            try:
                fmt = '%H:%M'
                tdelta = datetime.strptime(data['end_time'], fmt) - datetime.strptime(data['start_time'], fmt)
                duration = max(0, int(tdelta.total_seconds() / 60))
            except ValueError:
                duration = 0

        # Execute Insert and capture the cursor to get the new ID
        cur = conn.execute("""INSERT INTO tasks (title, log_date, start_time, end_time, duration_minutes, p_id, w_id, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                     (data['title'], data['log_date'], data.get('start_time'), data.get('end_time'), 
                      duration, data.get('p_id'), data.get('w_id'), data.get('status', 'Pending')))
        conn.commit()
        
        # Return the new ID so React can update its state immediately
        return jsonify({'message': 'Task Logged', 'id': cur.lastrowid}), 201

    rows = conn.execute("""
        SELECT t.*, p.name as project_name, w.name as work_type_name 
        FROM tasks t
        JOIN projects p ON t.p_id = p.p_id
        JOIN work_types w ON t.w_id = w.w_id
        ORDER BY t.log_date DESC, t.id DESC
    """).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
def handle_task(task_id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        return jsonify({'message': 'Deleted'}), 200

    if request.method == 'PUT':
        data = request.json
        duration = data.get('duration_minutes', 0)
        
        # If duration is 0 but we have times, calculate it
        if duration == 0 and data.get('start_time') and data.get('end_time'):
            try:
                fmt = '%H:%M'
                tdelta = datetime.strptime(data['end_time'], fmt) - datetime.strptime(data['start_time'], fmt)
                duration = max(0, int(tdelta.total_seconds() / 60))
            except:
                duration = 0

        # UPDATE: Now includes start_time and end_time
        conn.execute("""UPDATE tasks 
                        SET title=?, log_date=?, duration_minutes=?, status=?, start_time=?, end_time=? 
                        WHERE id=?""",
                     (data['title'], data['log_date'], duration, data['status'], 
                      data.get('start_time'), data.get('end_time'), task_id))
        conn.commit()
        return jsonify({'message': 'Updated'}), 200

# --- SUMMARY ENDPOINT ---
@app.route('/api/summary/<date>', methods=['GET'])
def get_summary(date):
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT t.duration_minutes, t.status, p.name as project_name, w.name as work_type_name
        FROM tasks t
        JOIN projects p ON t.p_id = p.p_id
        JOIN work_types w ON t.w_id = w.w_id
        WHERE t.log_date = ?
    """, (date,)).fetchall()
    
    breakdown = {}
    total_logged = 0
    for row in rows:
        duration = row['duration_minutes'] or 0
        total_logged += duration
        w_type = row['work_type_name']
        project = row['project_name']
        if w_type not in breakdown: breakdown[w_type] = {"projects": {}}
        if project not in breakdown[w_type]["projects"]: breakdown[w_type]["projects"][project] = {"tasks": []}
        breakdown[w_type]["projects"][project]["tasks"].append({"duration": duration, "status": row['status']})

    return jsonify({"total_logged": total_logged, "breakdown": breakdown})

if __name__ == '__main__':
    app.run(debug=True, port=5000)