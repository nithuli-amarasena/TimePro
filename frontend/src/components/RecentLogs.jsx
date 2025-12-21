import React, { useState, useEffect } from 'react';
import { Trash2, Pencil, RefreshCw } from 'lucide-react'; 
import './RecentLogs.css';

const RecentLogs = ({ refresh, onEdit }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/tasks');
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
      const res = await fetch(`http://127.0.0.1:5000/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    }
  };

  return (
    <div className="recent-logs-container card">
      <div className="logs-header">
        <h3>Recent Activity</h3>
        <button onClick={fetchLogs} className="refresh-icon-btn" title="Refresh">
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="table-responsive">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Task Details</th>
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
                  <td>{log.log_date}</td>
                  <td>
                    <div className="task-title">{log.title}</div>
                    <small className="work-type-tag">{log.work_type_name}</small>
                  </td>
                  <td>{log.project_name}</td>
                  <td>{Math.floor(log.duration_minutes / 60)}h {log.duration_minutes % 60}m</td>
                  <td>
                    <span className={`status-pill ${log.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {/* EDIT BUTTON */}
                    <button 
                      onClick={() => onEdit(log)}
                      className="action-btn edit-btn" 
                      title="Edit Task"
                    >
                      <Pencil size={16} />
                    </button>
                    
                    {/* DELETE BUTTON */}
                    <button 
                      onClick={() => handleDelete(log.id)} 
                      className="action-btn delete-btn" 
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">No logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentLogs;