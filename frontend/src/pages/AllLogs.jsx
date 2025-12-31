import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar as CalendarIcon, Clock, Edit2, 
  Trash2, X, Filter, RotateCcw, ChevronDown 
} from 'lucide-react';
import './AllLogs.css';

const AllLogs = () => {
  // 1. STATE INITIALIZATION
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // 2. DATA FETCHING
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Changed logsRes URL to /api/tasks to match your app.py
      const [logsRes, projRes, workRes] = await Promise.all([
        fetch('http://localhost:5000/api/tasks'), 
        fetch('http://localhost:5000/api/projects'),
        fetch('http://localhost:5000/api/work-types')
      ]);

      const logsData = await logsRes.json();
      const projData = await projRes.json();
      const workData = await workRes.json();

      setLogs(logsData);
      setProjects(projData);
      setWorkTypes(workData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  // 3. ACTION HANDLERS
  const openEditModal = (log) => {
    setEditingTask({ ...log });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        await fetch(`http://localhost:5000/api/tasks/${id}`, { method: 'DELETE' });
        setLogs(logs.filter(log => log.id !== id));
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchData(); 
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // 4. FILTERING & CALCULATIONS (Using p_id and w_id)
  const processedLogs = logs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Updated to use p_id and w_id from the database/backend
    const logPid = log.p_id ? log.p_id.toString() : "";
    const logWid = log.w_id ? log.w_id.toString() : "";

    const matchesProject = !filterProject || logPid === filterProject;
    const matchesWorkType = !filterWorkType || logWid === filterWorkType;
    
    const matchesStatus = !filterStatus || log.status === filterStatus;
    const matchesDate = !filterDate || log.log_date === filterDate;

    return matchesSearch && matchesProject && matchesWorkType && matchesStatus && matchesDate;
  });

  const totalMinutes = processedLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterProject('');
    setFilterWorkType('');
    setFilterStatus('');
    setFilterDate('');
  };

  const downloadCSV = () => {
    const headers = ["Date", "Work Type", "Project", "Task", "Start", "End", "Duration", "Status"];
    const csvRows = processedLogs.map(log => [
      log.log_date,
      log.work_type_name,
      log.project_name,
      `"${log.title.replace(/"/g, '""')}"`,
      log.start_time,
      log.end_time,
      log.duration_minutes,
      log.status
    ]);

    const csvContent = [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "time_logs.csv");
    link.click();
  };

  if (loading) return <div className="loading">Loading logs...</div>;

  return (
    <div className="all-logs-container">
      <div className="page-header">
        <h2 className="page-title">All Log History</h2>
        <div className="header-actions">
          <button className="btn-download" onClick={downloadCSV}>
            📥 Export CSV
          </button>
          <button className="btn-reset" onClick={resetFilters}>
            <RotateCcw size={16} /> Reset Filters
          </button>
        </div>      
      </div>

      <div className="filter-card">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Search Tasks</label>
            <div className="input-with-icon">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search by description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Project</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.p_id} value={p.p_id}>{p.name}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Work Type</label>
            <select value={filterWorkType} onChange={(e) => setFilterWorkType(e.target.value)}>
              <option value="">All Types</option>
              {workTypes.map(w => <option key={w.w_id} value={w.w_id}>{w.name}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Work Type</th>
              <th>Project</th>
              <th>Task Description</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedLogs.map((log) => (
              <tr key={log.id}>
                <td className="text-muted">
                  <div className="flex-cell">{log.log_date}</div>
                </td>
                <td><span className="badge-work">{log.work_type_name}</span></td>
                <td className="font-medium">{log.project_name}</td>
                <td className="task-title">{log.title}</td>
                <td className="text-muted">
                  <div className="flex-cell">{log.start_time}-{log.end_time}</div>
                </td>
                <td className="font-bold">{formatDuration(log.duration_minutes)}</td>
                <td>
                  <span className={`status-badge ${log.status?.toLowerCase().replace(/\s/g, '')}`}>
                    {log.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn-icon" onClick={() => openEditModal(log)}><Edit2 size={16} /></button>
                  <button className="btn-icon delete" onClick={() => handleDelete(log.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="table-footer">
            <tr>
              <td colSpan="5" className="text-right">Total Filtered Time:</td>
              <td className="total-duration-cell">{formatDuration(totalMinutes)}</td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Activity</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="modal-form">
              <div className="form-group">
                <label>Task Description</label>
                <input 
                  type="text" 
                  value={editingTask.title} 
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Project</label>
                  <select 
                    value={editingTask.p_id} // Changed to p_id
                    onChange={e => setEditingTask({...editingTask, p_id: e.target.value})}
                  >
                    {projects.map(p => <option key={p.p_id} value={p.p_id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Work Type</label>
                  <select 
                    value={editingTask.w_id} // Changed to w_id
                    onChange={e => setEditingTask({...editingTask, w_id: e.target.value})}
                  >
                    {workTypes.map(w => <option key={w.w_id} value={w.w_id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={editingTask.status} 
                    onChange={e => setEditingTask({...editingTask, status: e.target.value})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={editingTask.log_date} 
                    onChange={e => setEditingTask({...editingTask, log_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input 
                    type="time" 
                    value={editingTask.start_time} 
                    onChange={e => setEditingTask({...editingTask, start_time: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input 
                    type="time" 
                    value={editingTask.end_time} 
                    onChange={e => setEditingTask({...editingTask, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllLogs;