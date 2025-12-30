import React, { useState, useEffect } from 'react';
import './AddEntry.css';

const AddEntry = ({ onTaskAdded, taskToEdit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    log_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    w_id: '',
    p_id: '',
    status: 'Pending' 
  });

  const [workTypes, setWorkTypes] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/work-types')
      .then(res => res.json())
      .then(data => setWorkTypes(data));
  }, []);

  useEffect(() => {
    if (taskToEdit) {
      setFormData(taskToEdit);
    }
  }, [taskToEdit]);

  useEffect(() => {
    if (formData.w_id) {
      fetch(`http://127.0.0.1:5000/api/projects?w_id=${formData.w_id}`)
        .then(res => res.json())
        .then(data => {
          setProjects(data);
          if (!taskToEdit) {
            setFormData(prev => ({ ...prev, p_id: '' }));
          }
        });
    }
  }, [formData.w_id, taskToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = taskToEdit ? 'PUT' : 'POST';
    const url = taskToEdit 
      ? `http://127.0.0.1:5000/api/tasks/${taskToEdit.id}` 
      : 'http://127.0.0.1:5000/api/tasks';

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      onTaskAdded(); 
      setFormData({ 
        title: '', 
        log_date: new Date().toISOString().split('T')[0], 
        start_time: '', 
        end_time: '', 
        w_id: '', 
        p_id: '', 
        status: 'Pending' 
      });
    } else {
      alert("Failed to save. Check terminal for errors.");
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">
        {taskToEdit ? '✏️ Edit Activity' : '🚀 Log New Activity'}
      </h3>

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-row">
          <div className="input-group">
            <label>Work Type</label>
            <select 
              value={formData.w_id} 
              onChange={(e) => setFormData({...formData, w_id: e.target.value})} 
              required
            >
              <option value="">Select Type...</option>
              {workTypes.map(w => <option key={w.w_id} value={w.w_id}>{w.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Project</label>
            <select 
              value={formData.p_id} 
              onChange={(e) => setFormData({...formData, p_id: e.target.value})} 
              required 
              disabled={!formData.w_id}
            >
              <option value="">Select Project...</option>
              {projects.map(p => <option key={p.p_id} value={p.p_id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Task Description</label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            required 
            placeholder="What are you working on?" 
          />
        </div>

        <div className="form-row status-row">
          <div className="input-group">
            <label>Date</label>
            <input 
              type="date" 
              value={formData.log_date} 
              onChange={(e) => setFormData({...formData, log_date: e.target.value})} 
            />
          </div>
          <div className="input-group">
            <label>Status</label>
            <select 
              value={formData.status} 
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="Pending">🕒 Pending</option>
              <option value="In Progress">⚡ In Progress</option>
              <option value="Completed">✅ Completed</option>
            </select>
          </div>
          <div className="input-group">
            <label>Start</label>
            <input 
              type="time" 
              value={formData.start_time} 
              onChange={(e) => setFormData({...formData, start_time: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label>End</label>
            <input 
              type="time" 
              value={formData.end_time} 
              onChange={(e) => setFormData({...formData, end_time: e.target.value})} 
              required 
            />
          </div>
        </div>

        <button type="submit" className="save-btn">
          {taskToEdit ? 'Save Changes' : 'Add to Log'}
        </button>

        {taskToEdit && (
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
};

export default AddEntry;