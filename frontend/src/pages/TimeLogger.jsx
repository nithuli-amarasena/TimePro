import React from 'react';
import AddEntry from '../components/AddEntry';

export default function TimeLogger() {
  const refreshList = () => {
    // We will build the "Recent Logs" table here in the next step
    console.log("Task saved! Refreshing...");
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Daily Logger</h1>
        <p style={{ color: '#888' }}>Track your work hours and project progress</p>
      </header>

      <AddEntry onTaskAdded={refreshList} />

      {/* Future: We will put a Table or Charts below this */}
    </div>
  );
}