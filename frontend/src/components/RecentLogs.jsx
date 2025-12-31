import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, RefreshCw, Activity } from 'lucide-react';
import './RecentLogs.css';

const RecentLogs = ({ refresh, onEdit }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/tasks');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refresh]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    }
  };

  return (
    <div className="recent-logs-container card">
      <div className="logs-header">
        <h3 className="card-title">
          <Activity size={20} className="header-icon" />
          Recent Activity
        </h3>
        <button 
          onClick={fetchLogs} 
          className={`refresh-icon-btn ${loading ? 'spinning' : ''}`} 
          title="Refresh Logs"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="table-responsive">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Task / Type</th>
              <th>Project</th>
              <th>Duration</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="task-title">{log.title}</div>
                    <small className="work-type-tag">{log.work_type_name}</small>
                  </td>
                  <td>{log.project_name}</td>
                  <td className="time-cell">
                    {Math.floor(log.duration_minutes / 60)}h {log.duration_minutes % 60}m
                  </td>
                  <td>
                    <span className={`status-pill ${log.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="actions-wrapper">
                      {/* FIX: Added onClick to trigger onEdit prop */}
                      <button 
                        onClick={() => onEdit(log)} 
                        className="action-btn edit-btn" 
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(log.id)} 
                        className="action-btn delete-btn"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">No logs found. Start by adding a task above!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentLogs;