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

@app.route('/')
def home():
    return jsonify({"status": "Backend is Running", "message": "Use /api/tasks to fetch data"})

# WORK TYPE ENDPOINTS
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

# PROJECT ENDPOINTS
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

    if w_id:
        rows = conn.execute("SELECT * FROM projects WHERE w_id = ?", (w_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM projects").fetchall()
    return jsonify([dict(r) for r in rows])

# TASK ENDPOINTS
@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        fmt = '%H:%M'
        tdelta = datetime.strptime(data['end_time'], fmt) - datetime.strptime(data['start_time'], fmt)
        duration = int(tdelta.total_seconds() / 60)

        conn.execute("""INSERT INTO tasks (title, log_date, start_time, end_time, duration_minutes, p_id, w_id, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                     (data['title'], data['log_date'], data['start_time'], 
                      data['end_time'], duration, data['p_id'], data['w_id'], data.get('status', 'Pending')))
        conn.commit()
        return jsonify({'message': 'Task Logged'}), 201

    rows = conn.execute("""
        SELECT t.*, p.name as project_name, w.name as work_type_name 
        FROM tasks t
        JOIN projects p ON t.p_id = p.p_id
        JOIN work_types w ON t.w_id = w.w_id
        ORDER BY t.log_date DESC, t.start_time DESC
    """).fetchall()
    return jsonify([dict(r) for r in rows])

# DAILY SUMMARY ENDPOINT
@app.route('/api/summary/<date>', methods=['GET'])
def get_summary(date):
    conn = get_db_connection()
    query = """
        SELECT t.duration_minutes, t.status, p.name as project_name, w.name as work_type_name
        FROM tasks t
        JOIN projects p ON t.p_id = p.p_id
        JOIN work_types w ON t.w_id = w.w_id
        WHERE t.log_date = ?
    """
    rows = conn.execute(query, (date,)).fetchall()
    
    breakdown = {}
    total_logged = 0

    for row in rows:
        duration = row['duration_minutes'] or 0
        status = row['status']
        w_type = row['work_type_name']
        project = row['project_name']

        total_logged += duration

        if w_type not in breakdown:
            breakdown[w_type] = {"projects": {}}
        if project not in breakdown[w_type]["projects"]:
            breakdown[w_type]["projects"][project] = {"tasks": []}

        breakdown[w_type]["projects"][project]["tasks"].append({
            "duration": duration,
            "status": status  
        })

    return jsonify({"total_logged": total_logged, "breakdown": breakdown})

# TASK UPDATE/DELETE ENDPOINT
@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
def handle_task(task_id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        cursor = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        return jsonify({'message': 'Deleted'}), 200 if cursor.rowcount > 0 else 404

    data = request.json
    fmt = '%H:%M'
    tdelta = datetime.strptime(data['end_time'], fmt) - datetime.strptime(data['start_time'], fmt)
    duration = int(tdelta.total_seconds() / 60)
    
    conn.execute("""UPDATE tasks SET title=?, log_date=?, start_time=?, end_time=?, 
                    duration_minutes=?, p_id=?, w_id=?, status=? WHERE id=?""",
                 (data['title'], data['log_date'], data['start_time'], data['end_time'], 
                  duration, data['p_id'], data['w_id'], data['status'], task_id))
    conn.commit()
    return jsonify({'message': 'Updated'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)