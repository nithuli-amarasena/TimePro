import React, { useState} from 'react';
import AddEntry from '../components/AddEntry';
import RecentLogs from '../components/RecentLogs';

export default function TimeLogger() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingTask, setEditingTask] = useState(null);

  const handleRefresh = () => { 
    setRefreshTrigger(prev => prev + 1); 
    setEditingTask(null); 
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Time Tracker</h1>
      </header>

      <AddEntry onTaskAdded={handleRefresh} taskToEdit={editingTask}/>
      <RecentLogs refresh={refreshTrigger} onEdit={handleEditClick} />

    </div>
  );
}