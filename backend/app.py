from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)
DATABASE = 'time_logger.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# --- 1. WORK TYPE ENDPOINTS ---
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

# --- 2. PROJECT ENDPOINTS (Filtered by Work Type) ---
@app.route('/api/projects', methods=['GET', 'POST'])
def projects():
    conn = get_db_connection()
    # If the frontend sends ?w_id=1, we only return projects for W01
    w_id = request.args.get('w_id')
    
    if request.method == 'POST':
        data = request.json
        cur = conn.execute("INSERT INTO projects (name, w_id) VALUES (?, ?)", 
                           (data['name'], data['w_id']))
        new_p_id = cur.lastrowid
        conn.commit()
        return jsonify({'p_id': new_p_id, 'name': data['name'], 'w_id': data['w_id']}), 201

    if w_id:
        rows = conn.execute("SELECT * FROM projects WHERE w_id = ?", (w_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM projects").fetchall()
    return jsonify([dict(r) for r in rows])

# --- 3. TASK ENDPOINTS ---
@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        # Calculate duration in minutes: (End - Start)
        fmt = '%H:%M'
        tdelta = datetime.strptime(data['end_time'], fmt) - datetime.strptime(data['start_time'], fmt)
        duration = int(tdelta.total_seconds() / 60)

        conn.execute("""INSERT INTO tasks (title, log_date, start_time, end_time, duration_minutes, p_id, w_id, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                     (data['title'], data['log_date'], data['start_time'], 
                      data['end_time'], duration, data['p_id'], data['w_id'], data.get('status')))
        conn.commit()
        return jsonify({'message': 'Task Logged'}), 201

    # Get tasks with Project/WorkType names joined
    rows = conn.execute("""
        SELECT t.*, p.name as project_name, w.name as work_type_name 
        FROM tasks t
        JOIN projects p ON t.p_id = p.p_id
        JOIN work_types w ON t.w_id = w.w_id
        ORDER BY t.log_date DESC
    """).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/summary/<date>', methods=['GET'])
def get_daily_summary(date):
    conn = get_db_connection()
    query = """
        SELECT t.title, t.duration_minutes, w.name as work_type, p.name as project
        FROM tasks t
        JOIN work_types w ON t.w_id = w.w_id
        JOIN projects p ON t.p_id = p.p_id
        WHERE t.log_date = ?
    """
    rows = conn.execute(query, (date,)).fetchall()
    conn.close()

    tasks = [dict(r) for r in rows]
    
    # Pie chart data structure
    summary = {}
    total_minutes = 0
    
    for task in tasks:
        w_name = task['work_type']
        p_name = task['project']
        duration = task['duration_minutes']
        total_minutes += duration
        
        if w_name not in summary:
            summary[w_name] = {"total": 0, "projects": {}}
        
        if p_name not in summary[w_name]["projects"]:
            summary[w_name]["projects"][p_name] = {"total": 0, "tasks": []}
            
        summary[w_name]["total"] += duration
        summary[w_name]["projects"][p_name]["total"] += duration
        summary[w_name]["projects"][p_name]["tasks"].append({
            "title": task['title'],
            "duration": duration
        })

    return jsonify({
        "total_logged": total_minutes,
        "breakdown": summary
    })

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db_connection()
    
    # 1. SQL command to delete a task by its ID
    sql_query = "DELETE FROM tasks WHERE id = ?"
    
    # 2. Execute the command using the ID passed in the URL
    cursor = conn.execute(sql_query, (task_id,))
    
    # 3. Check if any rows were affected (i.e., if the task existed)
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'message': f'Task with ID {task_id} not found'}), 404
        
    conn.commit()
    conn.close()
    
    # 4. Return a success message
    return jsonify({'message': f'Task with ID {task_id} deleted successfully'}), 200

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    conn = get_db_connection()
    data = request.get_json()

    # Calculate duration in minutes
    fmt = '%H:%M'
    try:
        tdelta = datetime.strptime(data['end_time'], fmt) - datetime.strptime(data['start_time'], fmt)
        duration = int(tdelta.total_seconds() / 60)
    except Exception as e:
        return jsonify({'message': 'Invalid time format'}), 400

    # Update ALL fields in the database
    sql_query = """
        UPDATE tasks SET 
        title = ?, 
        log_date = ?,
        start_time = ?, 
        end_time = ?,
        duration_minutes = ?,
        p_id = ?,
        w_id = ?,
        status = ?
        WHERE id = ?
    """
    
    cursor = conn.execute(sql_query, (
        data['title'], 
        data['log_date'],
        data['start_time'], 
        data['end_time'], 
        duration,
        data['p_id'],
        data['w_id'],
        data['status'],
        task_id
    ))
    
    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({'message': 'Task not found'}), 404
    else:
        return jsonify({'message': 'Task updated successfully'}), 200
    
# 4. Run the application
if __name__ == '__main__':
    app.run(debug=True, port=5000)  