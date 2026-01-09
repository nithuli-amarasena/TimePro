import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Briefcase, ListTodo, ChevronRight, 
  Clock, Plus, Edit2, X, Check, Trash2,
  LayoutGrid, BarChart3, TrendingUp
} from 'lucide-react';
import './ProjectManagement.css';
import { useAuth } from '../context/AuthContext';

const ProjectManagement = () => {
  const { checkAuthStatus } = useAuth();
  
  // --- Data State ---
  const [workTypes, setWorkTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  
  // --- Selection State ---
  const [activeTab, setActiveTab] = useState('explorer');
  const [selectedWId, setSelectedWId] = useState(null);
  const [selectedPId, setSelectedPId] = useState(null);

  // --- UI Visibility ---
  const [showAddWT, setShowAddWT] = useState(false);
  const [showAddP, setShowAddP] = useState(false);
  const [showAddT, setShowAddT] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- Input State ---
  const [newWTName, setNewWTName] = useState('');
  const [newPName, setNewPName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editType, setEditType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const options = { credentials: 'include' };
      const [wRes, pRes, tRes] = await Promise.all([
        fetch('http://localhost:5000/api/work-types', options),
        fetch('http://localhost:5000/api/projects', options),
        fetch('http://localhost:5000/api/tasks', options)
      ]);
      
      // If any request returns 401, re-verify auth context
      if (wRes.status === 401 || pRes.status === 401 || tRes.status === 401) { 
        checkAuthStatus(); 
        return; 
      }

      if (wRes.ok) setWorkTypes(await wRes.json());
      if (pRes.ok) setProjects(await pRes.json());
      if (tRes.ok) setAllTasks(await tRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // --- ADD HANDLERS ---

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedPId || !selectedWId) return;
    
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title: newTaskTitle, 
            p_id: selectedPId,
            w_id: selectedWId, // Sending w_id explicitly for better data integrity
            log_date: new Date().toISOString().split('T')[0], // Defaults to today
            status: 'Pending' 
        }),
        credentials: 'include'
      });

      if (res.ok) {
        await fetchData();
        setNewTaskTitle('');
        setShowAddT(false);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Failed to add task"}`);
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  const handleAddWorkType = async () => {
    if (!newWTName.trim()) return;
    const res = await fetch('http://localhost:5000/api/work-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newWTName }),
      credentials: 'include'
    });
    if (res.ok) { fetchData(); setNewWTName(''); setShowAddWT(false); }
  };

  const handleAddProject = async () => {
    if (!newPName.trim() || !selectedWId) return;
    const res = await fetch('http://localhost:5000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPName, w_id: selectedWId }),
      credentials: 'include'
    });
    if (res.ok) { fetchData(); setNewPName(''); setShowAddP(false); }
  };

  // --- EDIT & DELETE HANDLERS ---

  const openEditModal = (type, item) => {
    setEditType(type);
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    const id = editType === 'task' ? editingItem.id : (editType === 'project' ? editingItem.p_id : editingItem.w_id);
    const endpoint = editType === 'task' ? `tasks/${id}` : (editType === 'project' ? `projects/${id}` : `work-types/${id}`);
    
    const res = await fetch(`http://localhost:5000/api/${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingItem),
      credentials: 'include'
    });
    if (res.ok) { fetchData(); setIsEditModalOpen(false); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    const endpoint = type === 'task' ? `tasks/${id}` : type === 'project' ? `projects/${id}` : `work-types/${id}`;
    
    const res = await fetch(`http://localhost:5000/api/${endpoint}`, { 
      method: 'DELETE', 
      credentials: 'include' 
    });
    
    if (res.ok) {
      fetchData();
      // Reset selections if the deleted item was currently selected
      if (type === 'work-type' && id === selectedWId) { setSelectedWId(null); setSelectedPId(null); }
      if (type === 'project' && id === selectedPId) { setSelectedPId(null); }
    }
  };

  // --- CALCULATIONS ---

  const stats = useMemo(() => ({
    totalHours: (allTasks.reduce((acc, t) => acc + (t.duration_minutes || 0), 0) / 60).toFixed(1),
    projectsCount: projects.length,
    tasksCount: allTasks.length,
    completionRate: allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'Completed').length / allTasks.length) * 100) : 0
  }), [allTasks, projects]);

  return (
    <div className="pm-container">
      <div className="pm-navbar">
        <div className="view-selector">
          <button className={`view-btn ${activeTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveTab('explorer')}>
            <LayoutGrid size={18} /> Explorer
          </button>
          <button className={`view-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <BarChart3 size={18} /> Dashboard
          </button>
        </div>
      </div>

      {activeTab === 'explorer' ? (
        <div className="explorer-layout">
          {/* Column 1: Work Types */}
          <div className="explorer-column">
            <div className="column-header">
              <span><Layers size={16} /> WORK TYPES</span>
              <button className="add-icon-btn" onClick={() => setShowAddWT(!showAddWT)}>
                {showAddWT ? <X size={16}/> : <Plus size={16}/>}
              </button>
            </div>
            {showAddWT && (
              <div className="inline-add">
                <input 
                  autoFocus 
                  value={newWTName} 
                  onChange={e => setNewWTName(e.target.value)} 
                  placeholder="New Category..." 
                  onKeyDown={e => e.key === 'Enter' && handleAddWorkType()}
                />
                <button onClick={handleAddWorkType} className="confirm-add"><Check size={14}/></button>
              </div>
            )}
            <div className="column-content">
              {workTypes.map(w => (
                <div key={w.w_id} className={`list-item ${selectedWId === w.w_id ? 'selected' : ''}`} onClick={() => {setSelectedWId(w.w_id); setSelectedPId(null);}}>
                  <span className="item-label">{w.name}</span>
                  <div className="item-ops">
                    <Edit2 size={12} onClick={(e) => { e.stopPropagation(); openEditModal('work-type', w); }} />
                    <Trash2 size={12} onClick={(e) => { e.stopPropagation(); handleDelete('work-type', w.w_id); }} />
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Projects */}
          <div className="explorer-column">
            <div className="column-header">
              <span><Briefcase size={16} /> PROJECTS</span>
              <button className="add-icon-btn" disabled={!selectedWId} onClick={() => setShowAddP(!showAddP)}>
                {showAddP ? <X size={16}/> : <Plus size={16}/>}
              </button>
            </div>
            {showAddP && (
              <div className="inline-add">
                <input 
                  autoFocus 
                  value={newPName} 
                  onChange={e => setNewPName(e.target.value)} 
                  placeholder="New Project..." 
                  onKeyDown={e => e.key === 'Enter' && handleAddProject()}
                />
                <button onClick={handleAddProject} className="confirm-add"><Check size={14}/></button>
              </div>
            )}
            <div className="column-content">
              {!selectedWId ? <p className="hint-text">Select a work type</p> : 
                projects.filter(p => p.w_id === selectedWId).map(p => (
                  <div key={p.p_id} className={`list-item ${selectedPId === p.p_id ? 'selected' : ''}`} onClick={() => setSelectedPId(p.p_id)}>
                    <span className="item-label">{p.name}</span>
                    <div className="item-ops">
                      <Edit2 size={12} onClick={(e) => { e.stopPropagation(); openEditModal('project', p); }} />
                      <Trash2 size={12} onClick={(e) => { e.stopPropagation(); handleDelete('project', p.p_id); }} />
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Column 3: Tasks */}
          <div className="explorer-column">
            <div className="column-header">
              <span><ListTodo size={16} /> TASK HISTORY</span>
              <button className="add-icon-btn" disabled={!selectedPId} onClick={() => setShowAddT(!showAddT)}>
                {showAddT ? <X size={16}/> : <Plus size={16}/>}
              </button>
            </div>
            {showAddT && (
              <div className="inline-add">
                <input 
                  autoFocus 
                  value={newTaskTitle} 
                  onChange={e => setNewTaskTitle(e.target.value)} 
                  placeholder="New Task..." 
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
                <button onClick={handleAddTask} className="confirm-add"><Check size={14}/></button>
              </div>
            )}
            <div className="column-content">
              {!selectedPId ? <p className="hint-text">Select a project</p> : 
                allTasks.filter(t => t.p_id === selectedPId).map(t => (
                  <div key={t.id} className="list-item task-item">
                    <span className="item-label">{t.title}</span>
                    <div className="item-ops">
                      <Edit2 size={12} onClick={() => openEditModal('task', t)} />
                      <Trash2 size={12} onClick={() => handleDelete('task', t.id)} />
                      <div className={`status-dot ${t.status?.toLowerCase()}`} title={t.status} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-view">
          <div className="metric-card"><Clock className="text-blue" /> <div><h5>Hours</h5><p>{stats.totalHours}h</p></div></div>
          <div className="metric-card"><TrendingUp className="text-green" /> <div><h5>Completion</h5><p>{stats.completionRate}%</p></div></div>
          <div className="metric-card"><Briefcase className="text-purple" /> <div><h5>Projects</h5><p>{stats.projectsCount}</p></div></div>
          <div className="metric-card"><ListTodo className="text-orange" /> <div><h5>Tasks</h5><p>{stats.tasksCount}</p></div></div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingItem && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Edit {editType.replace('-', ' ')}</h3>
              <X className="modal-close" onClick={() => setIsEditModalOpen(false)} />
            </div>
            <div className="modal-inner">
              <label>Name / Title</label>
              <input 
                autoFocus
                value={editType === 'task' ? (editingItem.title || '') : (editingItem.name || '')} 
                onChange={e => setEditingItem(prev => ({...prev, [editType === 'task' ? 'title' : 'name']: e.target.value}))} 
                onKeyDown={e => e.key === 'Enter' && handleUpdate()}
              />
            </div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={handleUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;