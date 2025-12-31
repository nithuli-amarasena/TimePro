import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Briefcase, ListTodo, ChevronRight, 
  Clock, Plus, Edit2, X, Check, Trash2,
  LayoutGrid, BarChart3, TrendingUp, CheckCircle2, Calendar, Zap
} from 'lucide-react';
import './ProjectManagement.css';

const ProjectManagement = () => {
  const [workTypes, setWorkTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  
  const [activeTab, setActiveTab] = useState('explorer');

  const [selectedWId, setSelectedWId] = useState(null);
  const [selectedPId, setSelectedPId] = useState(null);

  const [showAddWT, setShowAddWT] = useState(false);
  const [showAddP, setShowAddP] = useState(false);
  const [showAddT, setShowAddT] = useState(false);
  
  const [newWTName, setNewWTName] = useState('');
  const [newPName, setNewPName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState(null); 
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wRes, pRes, tRes] = await Promise.all([
        fetch('http://localhost:5000/api/work-types'),
        fetch('http://localhost:5000/api/projects'),
        fetch('http://localhost:5000/api/tasks')
      ]);
      setWorkTypes(await wRes.json());
      setProjects(await pRes.json());
      setAllTasks(await tRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = allTasks.filter(t => t.log_date === today);
    const completed = allTasks.filter(t => t.status === 'Completed');
    
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const mins = allTasks
        .filter(t => t.log_date === dStr)
        .reduce((s, t) => s + (Number(t.duration_minutes) || 0), 0);
      weekly.push({ 
        day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        minutes: mins 
      });
    }

    const projDist = projects.map(p => {
      const mins = allTasks
        .filter(t => t.p_id === p.p_id)
        .reduce((s, t) => s + (Number(t.duration_minutes) || 0), 0);
      return { name: p.name, minutes: mins };
    }).filter(p => p.minutes > 0).sort((a, b) => b.minutes - a.minutes);

    return {
      todayMins: todayTasks.reduce((s, t) => s + (Number(t.duration_minutes) || 0), 0),
      completionRate: allTasks.length ? Math.round((completed.length / allTasks.length) * 100) : 0,
      totalTasks: allTasks.length,
      avgMins: completed.length ? Math.round(completed.reduce((s,t) => s + (Number(t.duration_minutes) || 0), 0) / completed.length) : 0,
      weekly,
      maxWeekly: Math.max(...weekly.map(w => w.minutes), 60),
      projDist
    };
  }, [allTasks, projects]);

  const formatDuration = (totalMinutes) => {
    if (!totalMinutes || totalMinutes === 0) return "0m";
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const startTotal = sH * 60 + sM;
    const endTotal = eH * 60 + eM;
    const diff = endTotal - startTotal;
    return diff > 0 ? diff : 0;
  };

  const handleAddWorkType = async () => {
    if (!newWTName.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/work-types', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWTName }),
      });

      if (res.ok) { 
        setNewWTName(''); 
        setShowAddWT(false); 
        fetchData(); 
      } else {
        // This will catch things like 400 or 500 errors from the server
        const errorData = await res.json().catch(() => ({}));
        console.error("Server Error:", errorData);
        alert("Server error: " + (errorData.message || "Could not save. Check console."));
      }
    } catch (err) {
      // This will catch network errors (e.g., server is down)
      console.error("Network error:", err);
      alert("Network error: Is your backend running on port 5000?");
    }
  };

  const handleAddProject = async () => {
    // FIX: Check selectedWId against null explicitly
    if (!newPName.trim() || selectedWId === null) return;
    const res = await fetch('http://localhost:5000/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPName, w_id: selectedWId }),
    });
    if (res.ok) { setNewPName(''); setShowAddP(false); fetchData(); }
  };

  const handleAddTask = async () => {
    // FIX: Check selectedPId against null explicitly
    if (!newTaskTitle.trim() || selectedPId === null) return;
    const res = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: newTaskTitle, p_id: selectedPId, w_id: selectedWId,
        log_date: new Date().toISOString().split('T')[0],
        duration_minutes: 0, status: 'Pending'
      }),
    });
    if (res.ok) { setNewTaskTitle(''); setShowAddT(false); fetchData(); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    const endpoint = type === 'work-type' ? `work-types/${id}` : type === 'project' ? `projects/${id}` : `tasks/${id}`;
    await fetch(`http://localhost:5000/api/${endpoint}`, { method: 'DELETE' });
    fetchData();
  };

  const openEditModal = (type, item) => {
    setEditType(type);
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (editType === 'task') {
      if (editingItem.start_time && editingItem.end_time) {
        if (editingItem.end_time <= editingItem.start_time) {
          alert("Error: End time must be after the start time.");
          return;
        }
      }
    }

    let endpoint = '';
    let id = '';
    if (editType === 'work-type') { endpoint = 'work-types'; id = editingItem.w_id; }
    else if (editType === 'project') { endpoint = 'projects'; id = editingItem.p_id; }
    else { endpoint = 'tasks'; id = editingItem.id; }

    try {
      const res = await fetch(`http://localhost:5000/api/${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) { setIsEditModalOpen(false); fetchData(); }
    } catch (err) { console.error("Update error:", err); }
  };

  return (
    <div className="pm-explorer-wrapper">
      <div className="view-toggle-header">
        <button className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveTab('explorer')}>
          <LayoutGrid size={16} /> Explorer
        </button>
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <BarChart3 size={16} /> Dashboard
        </button>
      </div>

      {activeTab === 'explorer' ? (
        <div className="column-container">
          <div className="explorer-column">
            <div className="column-header">
              <div className="header-left"><Layers size={18} /> <h3>Work Types</h3></div>
              <button className="btn-add-circle" onClick={() => setShowAddWT(!showAddWT)}>
                {showAddWT ? <X size={20} color="#3b82f6" /> : <Plus size={20} color="#3b82f6" />}
              </button>
            </div>
            <div className="column-content">
              {showAddWT && (
                <div className="inline-add-container">
                  <div className="input-wrapper">
                    <input autoFocus placeholder="New Work Type..." value={newWTName} onChange={e => setNewWTName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddWorkType()} />
                    <button className="confirm-btn" onClick={handleAddWorkType}><Check size={20} color="white" /></button>
                  </div>
                </div>
              )}
              {workTypes.map(w => (
                <div key={w.w_id} className={`nav-card ${selectedWId === w.w_id ? 'active' : ''}`} onClick={() => { setSelectedWId(w.w_id); setSelectedPId(null); }}>
                  <div className="card-left-info"><span className="name">{w.name}</span><span className="count">{projects.filter(p => p.w_id === w.w_id).length}</span></div>
                  <div className="card-right-actions">
                    <button className="action-icon" onClick={(e) => { e.stopPropagation(); openEditModal('work-type', w); }}><Edit2 size={14} /></button>
                    <button className="action-icon del" onClick={(e) => { e.stopPropagation(); handleDelete('work-type', w.w_id); }}><Trash2 size={14} /></button>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FIX: Column 2 Disabled check */}
          <div className={`explorer-column ${selectedWId === null ? 'disabled' : ''}`}>
            <div className="column-header">
              <div className="header-left"><Briefcase size={18} /> <h3>Projects</h3></div>
              {selectedWId !== null && (
                <button className="btn-add-circle" onClick={() => setShowAddP(!showAddP)}>
                  {showAddP ? <X size={20} color="#3b82f6" /> : <Plus size={20} color="#3b82f6" />}
                </button>
              )}
            </div>
            <div className="column-content">
              {showAddP && (
                <div className="inline-add-container">
                  <div className="input-wrapper">
                    <input autoFocus placeholder="New Project..." value={newPName} onChange={e => setNewPName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddProject()} />
                    <button className="confirm-btn" onClick={handleAddProject}><Check size={20} color="white" /></button>
                  </div>
                </div>
              )}
              {selectedWId !== null ? projects.filter(p => p.w_id === selectedWId).map(p => (
                <div key={p.p_id} className={`nav-card ${selectedPId === p.p_id ? 'active' : ''}`} onClick={() => setSelectedPId(p.p_id)}>
                  <div className="card-left-info"><span className="name">{p.name}</span><span className="count">{allTasks.filter(t => t.p_id === p.p_id).length}</span></div>
                  <div className="card-right-actions">
                    <button className="action-icon" onClick={(e) => { e.stopPropagation(); openEditModal('project', p); }}><Edit2 size={14} /></button>
                    <button className="action-icon del" onClick={(e) => { e.stopPropagation(); handleDelete('project', p.p_id); }}><Trash2 size={14} /></button>
                    <ChevronRight size={16} />
                  </div>
                </div>
              )) : <div className="placeholder">Select a Work Type</div>}
            </div>
          </div>

          {/* FIX: Column 3 Disabled check */}
          <div className={`explorer-column wide-column ${selectedPId === null ? 'disabled' : ''}`}>
            <div className="column-header">
              <div className="header-left"><ListTodo size={18} /> <h3>Task History</h3></div>
              {selectedPId !== null && (
                <button className="btn-add-circle" onClick={() => setShowAddT(!showAddT)}>
                  {showAddT ? <X size={20} color="#3b82f6" /> : <Plus size={20} color="#3b82f6" />}
                </button>
              )}
            </div>
            <div className="column-content">
              {showAddT && (
                <div className="inline-add-container">
                  <div className="input-wrapper">
                    <input autoFocus placeholder="Task title..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} />
                    <button className="confirm-btn" onClick={handleAddTask}><Check size={20} color="white" /></button>
                  </div>
                </div>
              )}
              {selectedPId !== null ? allTasks.filter(t => t.p_id === selectedPId).map(t => (
                <div key={t.id} className="task-row-card">
                  <div className="task-card-left">
                    <span className="task-title-text">{t.title}</span>
                    <div className="task-meta-row">
                      <Clock size={13} className="meta-icon" />
                      <span className="duration-highlight">{formatDuration(t.duration_minutes)}</span>
                      <span className="meta-sep">•</span>
                      <span className="date-text">{t.log_date}</span>
                    </div>
                  </div>
                  <div className="task-card-right">
                    <span className={`status-tag ${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.status}
                    </span>
                    <div className="task-card-actions">
                      <button className="mini-icon-btn" onClick={() => openEditModal('task', t)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="mini-icon-btn del" onClick={() => handleDelete('task', t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : <div className="placeholder">Select a Project</div>}
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD VIEW */
        <div className="dashboard-grid">
          <div className="d-card metric">
            <div className="metric-icon blue"><Clock size={20} /></div>
            <div><span className="label">Logged Today</span><span className="value">{formatDuration(stats.todayMins)}</span></div>
          </div>
          <div className="d-card metric">
            <div className="metric-icon green"><CheckCircle2 size={20} /></div>
            <div><span className="label">Completion</span><span className="value">{stats.completionRate}%</span></div>
            <div className="mini-progress"><div className="fill" style={{width: `${stats.completionRate}%`}}></div></div>
          </div>
          <div className="d-card metric">
            <div className="metric-icon orange"><Zap size={20} /></div>
            <div><span className="label">Avg Task Time</span><span className="value">{formatDuration(stats.avgMins)}</span></div>
          </div>
          <div className="d-card metric">
            <div className="metric-icon purple"><Calendar size={20} /></div>
            <div><span className="label">Total Tasks</span><span className="value">{stats.totalTasks}</span></div>
          </div>

          <div className="d-card chart-main">
            <div className="card-header"><h4><TrendingUp size={16} /> Weekly Productivity</h4></div>
            <div className="v-bar-chart">
              {stats.weekly.map((d, i) => (
                <div key={i} className="bar-group">
                  <div className="bar-wrapper">
                    <div className="tooltip">{formatDuration(d.minutes)}</div>
                    <div className="bar-fill" style={{height: `${(d.minutes / stats.maxWeekly) * 100}%`}}></div>
                  </div>
                  <span className="bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="d-card chart-side">
            <div className="card-header"><h4>Distribution</h4></div>
            <div className="h-list">
              {stats.projDist.map((p, i) => (
                <div key={i} className="h-item">
                  <div className="h-label"><span>{p.name}</span> <span>{formatDuration(p.minutes)}</span></div>
                  <div className="h-bar"><div className="fill" style={{width: `${(p.minutes / (stats.projDist[0]?.minutes || 1)) * 100}%`}}></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingItem && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit {editType.replace('-', ' ')}</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{editType === 'task' ? 'Task Title' : 'Name'}</label>
                <input type="text" value={editType === 'task' ? editingItem.title : editingItem.name} 
                  onChange={e => setEditingItem({...editingItem, [editType === 'task' ? 'title' : 'name']: e.target.value})} 
                />
              </div>
              
              {editType === 'task' && (
                <>
                  <div className="form-row">
                    <div className="form-group"><label>Start Time</label><input type="time" value={editingItem.start_time || ''} onChange={e => setEditingItem({...editingItem, start_time: e.target.value, duration_minutes: calculateDuration(e.target.value, editingItem.end_time)})} /></div>
                    <div className="form-group"><label>End Time</label><input type="time" value={editingItem.end_time || ''} onChange={e => setEditingItem({...editingItem, end_time: e.target.value, duration_minutes: calculateDuration(editingItem.start_time, e.target.value)})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Duration (min)</label><input type="number" value={editingItem.duration_minutes} onChange={e => setEditingItem({...editingItem, duration_minutes: Number(e.target.value)})} /></div>
                    <div className="form-group"><label>Status</label>
                      <select value={editingItem.status} onChange={e => setEditingItem({...editingItem, status: e.target.value})}>
                        <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>Date</label><input type="date" value={editingItem.log_date} onChange={e => setEditingItem({...editingItem, log_date: e.target.value})} /></div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={handleUpdate}>Update Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;