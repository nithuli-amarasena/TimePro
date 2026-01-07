import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Briefcase, ListTodo, ChevronRight, 
  Clock, Plus, Edit2, X, Check, Trash2,
  LayoutGrid, BarChart3, TrendingUp, CheckCircle2, Calendar, Zap
} from 'lucide-react';
import './ProjectManagement.css';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth

const ProjectManagement = () => {
  const { checkAuthStatus } = useAuth(); // 2. Get the refresh helper
  
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
      const options = { credentials: 'include' };
      
      const [wRes, pRes, tRes] = await Promise.all([
        fetch('http://localhost:5000/api/work-types', options),
        fetch('http://localhost:5000/api/projects', options),
        fetch('http://localhost:5000/api/tasks', options)
      ]);

      // 3. Handle Unauthorized (Session Expired)
      if (wRes.status === 401 || pRes.status === 401 || tRes.status === 401) {
        console.warn("Session expired. Re-verifying auth...");
        checkAuthStatus(); // This triggers the logout in Context
        return;
      }

      if (wRes.ok && pRes.ok && tRes.ok) {
        setWorkTypes(await wRes.json());
        setProjects(await pRes.json());
        setAllTasks(await tRes.json());
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const stats = useMemo(() => {
    // Ensure we are working with arrays even if fetch fails
    const tasksArr = Array.isArray(allTasks) ? allTasks : [];
    const projArr = Array.isArray(projects) ? projects : [];

    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasksArr.filter(t => t.log_date === today);
    const completed = tasksArr.filter(t => t.status === 'Completed');
    
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const mins = tasksArr
        .filter(t => t.log_date === dStr)
        .reduce((s, t) => s + (Number(t.duration_minutes) || 0), 0);
      weekly.push({ 
        day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        minutes: mins 
      });
    }

    const projDist = projArr.map(p => {
      const mins = tasksArr
        .filter(t => t.p_id === p.p_id)
        .reduce((s, t) => s + (Number(t.duration_minutes) || 0), 0);
      return { name: p.name, minutes: mins };
    }).filter(p => p.minutes > 0).sort((a, b) => b.minutes - a.minutes);

    return {
      todayMins: todayTasks.reduce((s, t) => s + (Number(t.duration_minutes) || 0), 0),
      completionRate: tasksArr.length ? Math.round((completed.length / tasksArr.length) * 100) : 0,
      totalTasks: tasksArr.length,
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
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const diff = (eH * 60 + eM) - (sH * 60 + sM);
    return diff > 0 ? diff : 0;
  };

  // ... (All handleAdd, handleDelete, handleUpdate functions remain same but ensure they use credentials: 'include')

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
              {/* 4. Use Array.isArray for safety */}
              {Array.isArray(workTypes) && workTypes.map(w => (
                <div key={w.w_id} className={`nav-card ${selectedWId === w.w_id ? 'active' : ''}`} onClick={() => { setSelectedWId(w.w_id); setSelectedPId(null); }}>
                  <div className="card-left-info"><span className="name">{w.name}</span><span className="count">{Array.isArray(projects) ? projects.filter(p => p.w_id === w.w_id).length : 0}</span></div>
                  <div className="card-right-actions">
                    <button className="action-icon" onClick={(e) => { e.stopPropagation(); openEditModal('work-type', w); }}><Edit2 size={14} /></button>
                    <button className="action-icon del" onClick={(e) => { e.stopPropagation(); handleDelete('work-type', w.w_id); }}><Trash2 size={14} /></button>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              {selectedWId !== null && Array.isArray(projects) ? projects.filter(p => p.w_id === selectedWId).map(p => (
                <div key={p.p_id} className={`nav-card ${selectedPId === p.p_id ? 'active' : ''}`} onClick={() => setSelectedPId(p.p_id)}>
                  <div className="card-left-info"><span className="name">{p.name}</span><span className="count">{Array.isArray(allTasks) ? allTasks.filter(t => t.p_id === p.p_id).length : 0}</span></div>
                  <div className="card-right-actions">
                    <button className="action-icon" onClick={(e) => { e.stopPropagation(); openEditModal('project', p); }}><Edit2 size={14} /></button>
                    <button className="action-icon del" onClick={(e) => { e.stopPropagation(); handleDelete('project', p.p_id); }}><Trash2 size={14} /></button>
                    <ChevronRight size={16} />
                  </div>
                </div>
              )) : <div className="placeholder">Select a Work Type</div>}
            </div>
          </div>

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
              {selectedPId !== null && Array.isArray(allTasks) ? allTasks.filter(t => t.p_id === selectedPId).map(t => (
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
        /* DASHBOARD VIEW logic remains same as provided in previous stats memo */
        <div className="dashboard-grid">
           {/* ... existing dashboard grid content ... */}
        </div>
      )}

      {/* ... existing modal logic ... */}
    </div>
  );
};

export default ProjectManagement;