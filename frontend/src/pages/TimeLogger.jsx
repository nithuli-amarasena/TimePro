import React, { useState } from 'react';
import AddEntry from '../components/AddEntry';
import DailySummary from '../components/DailySummary';
import RecentLogs from '../components/RecentLogs';
import { useAuth } from '../context/AuthContext'; // Added for personalization

const TimeLogger = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingTask, setEditingTask] = useState(null);
  const { user } = useAuth(); // Get user info

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="page-wrapper">
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>Time Tracker</h1>
        <p className="text-muted">Welcome back, <span className="blue-text">{user?.name}</span></p>
      </header>

      <div className="dashboard-top-row">
        <AddEntry 
          onTaskAdded={handleRefresh} 
          taskToEdit={editingTask}
          onCancel={() => setEditingTask(null)} 
        />
        <DailySummary refresh={refreshTrigger} />
      </div>

      <RecentLogs 
        refresh={refreshTrigger} 
        onEdit={(task) => {
          setEditingTask(task);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
      />
    </div>
  );
};

export default TimeLogger;