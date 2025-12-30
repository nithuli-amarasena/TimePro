import React, { useState } from 'react';
import { Clock, LayoutDashboard } from 'lucide-react';
import AddEntry from '../components/AddEntry';
import DailySummary from '../components/DailySummary';
import RecentLogs from '../components/RecentLogs';
import './TimeLogger.css';

const TimeLogger = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingTask, setEditingTask] = useState(null);

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="page-wrapper">
      {/* Polished Header Section */}
      <header className="page-header">
        <div className="header-content">
          <div className="title-group">
            <div>
              <h1>Time Tracker</h1>
              <p className="subtitle">Monitor and manage your daily productivity</p>
            </div>
          </div>
          <div className="header-actions">
             <span className="status-indicator">
               <span className="pulse-dot"></span> System Active
             </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="dashboard-grid">
        <div className="dashboard-top-row">
          <AddEntry 
            onTaskAdded={handleRefresh} 
            taskToEdit={editingTask} 
            onCancel={() => setEditingTask(null)} 
          />
          <DailySummary refresh={refreshTrigger} />
        </div>

        <div className="dashboard-bottom-row">
          <RecentLogs 
            refresh={refreshTrigger} 
            onEdit={(task) => {
              setEditingTask(task);
              // Smoothly scroll to the form for better mobile UX
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default TimeLogger;