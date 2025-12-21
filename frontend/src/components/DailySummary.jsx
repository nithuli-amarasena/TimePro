import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import './DailySummary.css';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

const DailySummary = ({ refresh }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State for toggling visibility
  const [expandedWorkTypes, setExpandedWorkTypes] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});

  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:5000/api/summary/${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching summary:", err);
        setLoading(false);
      });
  }, [refresh, selectedDate]);

  // Handlers for toggles
  const toggleWorkType = (name) => {
    setExpandedWorkTypes(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleProject = (name) => {
    setExpandedProjects(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const chartData = data && data.total_logged > 0 
    ? Object.keys(data.breakdown).map((key) => ({
        name: key,
        value: data.breakdown[key].total,
      }))
    : [];

  return (
    <div className="daily-summary-card card">
      <div className="summary-header">
        <div className="header-left">
          <div className="title-group">
            <h2>Daily Summary</h2>
            <div className="date-picker-container">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="summary-date-input"
              />
            </div>
          </div>
        </div>
        
        {data && data.total_logged > 0 && (
          <div className="total-logged-badge">
            <Clock size={16} />
            <span>Total: <strong>{formatTime(data.total_logged)}</strong></span>
          </div>
        )}
      </div>

      {!data || data.total_logged === 0 ? (
        <div className="empty-summary">
          <p>No activity logged for this date.</p>
        </div>
      ) : (
        <div className={`summary-layout ${loading ? 'fetching' : ''}`}>
          <div className="summary-list-section">
            {Object.entries(data.breakdown).map(([wName, wData]) => (
              <div key={wName} className="work-type-block">
                {/* Clickable Work Type Header */}
                <div className="w-header" onClick={() => toggleWorkType(wName)}>
                  <span className="w-name">
                    {expandedWorkTypes[wName] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    {wName}
                  </span>
                  <span className="w-time">{formatTime(wData.total)}</span>
                </div>
                
                {/* Conditional Projects List */}
                {expandedWorkTypes[wName] && (
                  <div className="p-container">
                    {Object.entries(wData.projects).map(([pName, pData]) => (
                      <div key={pName} className="project-block">
                        {/* Clickable Project Header */}
                        <div className="p-header" onClick={() => toggleProject(pName)}>
                          <span className="p-name">
                            {expandedProjects[pName] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            {pName}
                          </span>
                          <span className="p-time">{formatTime(pData.total)}</span>
                        </div>
                        
                        {/* Conditional Tasks List */}
                        {expandedProjects[pName] && (
                          <div className="t-container">
                            {pData.tasks.map((task, idx) => (
                              <div key={idx} className="task-row">
                                <span className="t-title">{task.title}</span>
                                <span className="t-time">{formatTime(task.duration)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="summary-chart-section">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => formatTime(value)} 
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySummary;