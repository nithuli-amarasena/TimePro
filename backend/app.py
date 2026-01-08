import os
import secrets  # Added for secure token generation
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta  # Added timedelta for token expiry
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# CORS must point exactly to your frontend URL
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

app.secret_key = os.urandom(24).hex() 

DATABASE = 'time_logger.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.execute("PRAGMA foreign_keys = ON;") 
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def home():
    return {"status": "Backend is running!"}, 200

# --- AUTHENTICATION ---
@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if "user_id" in session:
        return jsonify({"authenticated": True, "user": session['user_name']}), 200
    return jsonify({"authenticated": False}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400

    hashed_password = generate_password_hash(password)
    db = get_db_connection()
    try:
        db.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
        db.commit()
        return jsonify({"message": "User created"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Username already taken"}), 400
    finally:
        db.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    db = get_db_connection()
    user = db.execute('SELECT * FROM users WHERE username = ?', (data.get('username'),)).fetchone()
    db.close()
    
    if user and check_password_hash(user['password'], data.get('password')):
        session['user_id'] = user['id']
        session['user_name'] = user['username']
        session.permanent = True 
        return jsonify({"message": "Success"}), 200
    
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

# --- FORGOT / RESET PASSWORD ---

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    username = data.get('username')
    
    db = get_db_connection()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if user:
        # Generate a unique 1-hour token
        token = secrets.token_urlsafe(32)
        # Store expiry as a string for SQLite comparison
        expiry = (datetime.now() + timedelta(hours=1)).isoformat()
        
        db.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE username = ?',
                   (token, expiry, username))
        db.commit()
        
        # In a real app, you'd email this. For now, we print it to the terminal.
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        print(f"\n[DEBUG] Password Reset Link for {username}:")
        print(f"{reset_link}\n")
        
    db.close()
    # Always return 200/Generic message to prevent username enumeration (security best practice)
    return jsonify({"message": "If that account exists, a reset link has been generated."}), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({"message": "Missing token or password"}), 400

    db = get_db_connection()
    # Find user where token matches AND expiry is in the future
    now = datetime.now().isoformat()
    user = db.execute('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?', 
                      (token, now)).fetchone()
    
    if not user:
        db.close()
        return jsonify({"message": "Invalid or expired token"}), 400
        
    hashed_pw = generate_password_hash(new_password)
    db.execute('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
               (hashed_pw, user['id']))
    db.commit()
    db.close()
    
    return jsonify({"message": "Password updated successfully"}), 200

# --- WORK TYPES ---

@app.route('/api/work-types', methods=['GET', 'POST'])
def work_types():
    if "user_id" not in session: return jsonify({"message": "Unauthorized"}), 401
    conn = get_db_connection()
    user_id = session['user_id']

    if request.method == 'POST':
        name = request.json.get('name')
        cur = conn.execute("INSERT INTO work_types (name, user_id) VALUES (?, ?)", (name, user_id))
        conn.commit()
        return jsonify({'w_id': cur.lastrowid, 'name': name}), 201
    
    rows = conn.execute("SELECT * FROM work_types WHERE user_id = ?", (user_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/work-types/<int:w_id>', methods=['PUT', 'DELETE'])
def handle_work_type(w_id):
    if "user_id" not in session: return jsonify({"message": "Unauthorized"}), 401
    conn = get_db_connection()
    user_id = session['user_id']

    if request.method == 'DELETE':
        conn.execute("DELETE FROM work_types WHERE w_id = ? AND user_id = ?", (w_id, user_id))
        conn.commit()
        return jsonify({'message': 'Deleted'}), 200

    if request.method == 'PUT':
        name = request.json.get('name')
        conn.execute("UPDATE work_types SET name = ? WHERE w_id = ? AND user_id = ?", (name, w_id, user_id))
        conn.commit()
        return jsonify({'message': 'Updated'}), 200

# --- PROJECTS ---

@app.route('/api/projects', methods=['GET', 'POST'])
def projects():
    if "user_id" not in session: return jsonify({"message": "Unauthorized"}), 401
    conn = get_db_connection()
    user_id = session['user_id']
    
    if request.method == 'POST':
        data = request.json
        cur = conn.execute("INSERT INTO projects (name, w_id, user_id) VALUES (?, ?, ?)", 
                           (data['name'], data['w_id'], user_id))
        conn.commit()
        return jsonify({'p_id': cur.lastrowid, 'name': data['name']}), 201

    rows = conn.execute("SELECT * FROM projects WHERE user_id = ?", (user_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/projects/<int:p_id>', methods=['PUT', 'DELETE'])
def handle_project(p_id):
    if "user_id" not in session: return jsonify({"message": "Unauthorized"}), 401
    conn = get_db_connection()
    user_id = session['user_id']

    if request.method == 'DELETE':
        conn.execute("DELETE FROM projects WHERE p_id = ? AND user_id = ?", (p_id, user_id))
        conn.commit()
        return jsonify({'message': 'Deleted'}), 200

    if request.method == 'PUT':
        name = request.json.get('name')
        conn.execute("UPDATE projects SET name = ? WHERE p_id = ? AND user_id = ?", (name, p_id, user_id))
        conn.commit()
        return jsonify({'message': 'Updated'}), 200

# --- TASKS ---

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    if "user_id" not in session: return jsonify({"message": "Unauthorized"}), 401
    conn = get_db_connection()
    user_id = session['user_id']

    if request.method == 'POST':
        data = request.json
        
        # 1. Handle missing log_date (default to today)
        log_date = data.get('log_date', datetime.now().strftime('%Y-%m-%d'))
        
        # 2. Extract IDs
        p_id = data.get('p_id')
        w_id = data.get('w_id')

        # 3. If w_id is missing, find it from the project table
        if p_id and not w_id:
            project = conn.execute("SELECT w_id FROM projects WHERE p_id = ?", (p_id,)).fetchone()
            if project:
                w_id = project['w_id']

        # 4. Final validation before database entry
        if not p_id or not w_id:
            return jsonify({"message": "Project ID and Work Type ID are required"}), 400

        start = data.get('start_time')
        end = data.get('end_time')
        duration = 0
        
        if start and end:
            try:
                fmt = '%H:%M'
                tdelta = datetime.strptime(end, fmt) - datetime.strptime(start, fmt)
                duration = max(0, int(tdelta.total_seconds() / 60))
            except: pass

        try:
            cur = conn.execute("""
                INSERT INTO tasks (user_id, title, log_date, start_time, end_time, duration_minutes, p_id, w_id, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (user_id, data.get('title', 'Untitled Task'), log_date, start, end, 
                 duration, p_id, w_id, data.get('status', 'Pending')))
            conn.commit()
            return jsonify({'message': 'Task Logged', 'id': cur.lastrowid}), 201
        except Exception as e:
            print(f"Error inserting task: {e}")
            return jsonify({"message": "Database error", "details": str(e)}), 500
        finally:
            conn.close()

    # GET logic remains the same...
    rows = conn.execute("""
        SELECT t.*, p.name as project_name, w.name as work_type_name 
        FROM tasks t
        JOIN projects p ON t.p_id = p.p_id
        JOIN work_types w ON t.w_id = w.w_id
        WHERE t.user_id = ?
        ORDER BY t.log_date DESC, t.id DESC
    """, (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
def handle_task(task_id):
    if "user_id" not in session: return jsonify({"message": "Unauthorized"}), 401
    conn = get_db_connection()
    user_id = session['user_id']

    if request.method == 'DELETE':
        conn.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
        conn.commit()
        return jsonify({'message': 'Deleted'}), 200

    if request.method == 'PUT':
        data = request.json
        start = data.get('start_time')
        end = data.get('end_time')
        duration = data.get('duration_minutes', 0)

        if start and end:
            try:
                fmt = '%H:%M'
                tdelta = datetime.strptime(end, fmt) - datetime.strptime(start, fmt)
                duration = max(0, int(tdelta.total_seconds() / 60))
            except: pass

        conn.execute("""UPDATE tasks 
                        SET title=?, log_date=?, duration_minutes=?, status=?, start_time=?, end_time=? 
                        WHERE id=? AND user_id=?""",
                     (data['title'], data['log_date'], duration, data['status'], 
                      start, end, task_id, user_id))
        conn.commit()
        return jsonify({'message': 'Updated'}), 200

# --- SUMMARY ---

@app.route('/api/summary/<date>', methods=['GET'])
def get_summary(date):
    if "user_id" not in session: return jsonify({"message": "Unauthorized"}), 401
    user_id = session['user_id']
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT t.duration_minutes, t.status, p.name as project_name, w.name as work_type_name, t.title
        FROM tasks t
        JOIN projects p ON t.p_id = p.p_id
        JOIN work_types w ON t.w_id = w.w_id
        WHERE t.log_date = ? AND t.user_id = ?
    """, (date, user_id)).fetchall()
    
    breakdown = {}
    total_logged = 0
    for row in rows:
        duration = row['duration_minutes'] or 0
        total_logged += duration
        w_type = row['work_type_name']
        project = row['project_name']
        if w_type not in breakdown: breakdown[w_type] = {"projects": {}}
        if project not in breakdown[w_type]["projects"]: breakdown[w_type]["projects"][project] = {"tasks": []}
        
        breakdown[w_type]["projects"][project]["tasks"].append({
            "title": row['title'],
            "duration": duration, 
            "status": row['status']
        })
    return jsonify({"total_logged": total_logged, "breakdown": breakdown})

if __name__ == '__main__':
    app.run(debug=True, port=5000)