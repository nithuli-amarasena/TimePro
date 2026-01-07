import React, { useState, useEffect } from 'react';
import { Zap, Edit2, Calendar, Clock, ListTodo, Save, RotateCcw, Briefcase, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Added for session management
import './AddEntry.css';

const AddEntry = ({ onTaskAdded, taskToEdit, onCancel }) => {
  const { checkAuthStatus } = useAuth(); // Destructure the check function
  const initialFormState = {
    title: '',
    log_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    w_id: '',
    p_id: '',
    status: 'Pending'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [workTypes, setWorkTypes] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/work-types', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setWorkTypes(data))
      .catch(err => console.error("Error fetching work types:", err));
  }, []);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title || '',
        log_date: taskToEdit.log_date ? taskToEdit.log_date.split('T')[0] : new Date().toISOString().split('T')[0],
        start_time: taskToEdit.start_time || '',
        end_time: taskToEdit.end_time || '',
        w_id: taskToEdit.w_id || '',
        p_id: taskToEdit.p_id || '',
        status: taskToEdit.status || 'Pending'
      });
    } else {
      setFormData(initialFormState);
    }
  }, [taskToEdit]);

  useEffect(() => {
    if (formData.w_id) {
      fetch(`http://localhost:5000/api/projects?w_id=${formData.w_id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setProjects(data);
          if (!taskToEdit || (taskToEdit && taskToEdit.w_id !== formData.w_id)) {
            if (!taskToEdit) setFormData(prev => ({ ...prev, p_id: '' }));
          }
        });
    } else {
      setProjects([]);
    }
  }, [formData.w_id, taskToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = taskToEdit ? 'PUT' : 'POST';
    const url = taskToEdit 
      ? `http://localhost:5000/api/tasks/${taskToEdit.id}` 
      : 'http://localhost:5000/api/tasks';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onTaskAdded(); 
        onCancel(); 
        setFormData(initialFormState);
      } else if (res.status === 401) {
        // Session expired: tell the AuthContext to re-verify, which triggers the redirect
        await checkAuthStatus();
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">
        {taskToEdit ? <Edit2 size={20} className="header-icon" /> : <Zap size={20} className="header-icon" />}
        {taskToEdit ? 'Edit Activity' : 'Log New Activity'}
      </h3>
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-row">
          <div className="input-group">
            <label><Layers size={12} /> Work Type</label>
            <select value={formData.w_id} onChange={(e) => setFormData({...formData, w_id: e.target.value})} required>
              <option value="">Select Type...</option>
              {workTypes.map(w => <option key={w.w_id} value={w.w_id}>{w.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label><Briefcase size={12} /> Project</label>
            <select value={formData.p_id} onChange={(e) => setFormData({...formData, p_id: e.target.value})} required disabled={!formData.w_id}>
              <option value="">Select Project...</option>
              {projects.map(p => <option key={p.p_id} value={p.p_id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label><ListTodo size={12} /> Task Description</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="What did you accomplish?" />
        </div>
        <div className="form-row status-row">
          <div className="input-group">
            <label><Calendar size={12} /> Date</label>
            <input type="date" value={formData.log_date} onChange={(e) => setFormData({...formData, log_date: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Status</label>
            <select className={`status-select ${formData.status.toLowerCase().replace(/\s+/g, '-')}`} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="input-group">
            <label><Clock size={12} /> Start</label>
            <input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} required />
          </div>
          <div className="input-group">
            <label><Clock size={12} /> End</label>
            <input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} required />
          </div>
        </div>
        <div className="action-row">
          <button type="submit" className="save-btn"><Save size={18} /> {taskToEdit ? 'Save Changes' : 'Add to Log'}</button>
          {taskToEdit && <button type="button" onClick={onCancel} className="cancel-btn"><RotateCcw size={18} /> Cancel</button>}
        </div>
      </form>
    </div>
  );
};

export default AddEntry;