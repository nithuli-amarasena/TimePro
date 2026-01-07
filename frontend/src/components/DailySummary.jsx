import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { CheckCircle, Clock, PieChart as PieIcon } from 'lucide-react';
import './DailySummary.css';

const COLORS_COMPLETED = ['#10b981', '#059669', '#34d399', '#064e3b']; 
const COLORS_PLANNED = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

const DailySummary = ({ refresh }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);

  useEffect(() => {
    // ADDED: credentials: 'include' as the second argument to fetch
    fetch(`http://localhost:5000/api/summary/${selectedDate}`, {
      credentials: 'include'
    })
      .then(res => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res.json();
      })
      .then(d => setData(d))
      .catch(err => console.error("Fetch error:", err));
  }, [refresh, selectedDate]);

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const stats = useMemo(() => {
    const plannedArr = [];
    const completedArr = [];
    let pSum = 0;
    let cSum = 0;

    if (data?.breakdown) {
      Object.entries(data.breakdown).forEach(([wName, wData]) => {
        let wTypePlannedMins = 0;
        let wTypeCompletedMins = 0;

        Object.values(wData.projects || {}).forEach(project => {
          project.tasks?.forEach(task => {
            const mins = Number(task.duration) || 0;
            const status = task.status?.toLowerCase().trim();

            wTypePlannedMins += mins;
            pSum += mins;

            if (status === 'completed') {
              wTypeCompletedMins += mins;
              cSum += mins;
            }
          });
        });

        if (wTypePlannedMins > 0) plannedArr.push({ name: wName, value: wTypePlannedMins });
        if (wTypeCompletedMins > 0) completedArr.push({ name: wName, value: wTypeCompletedMins });
      });
    }
    return { plannedArr, completedArr, pSum, cSum };
  }, [data]);

  return (
    <div className="card daily-summary-card">
      <div className="summary-header">
        <h3 className="card-title">
          <PieIcon size={20} className="icon-blue" /> 
          Progress Overview
        </h3>
        <div className="date-picker-container">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="summary-date-input" 
          />
        </div>
      </div>

      {!data || data.total_logged === 0 ? (
        <div className="empty-summary">No activity logged for this date.</div>
      ) : (
        <div className="charts-row">
          <div className="chart-item">
            <div className="chart-label"><Clock size={14}/> PLANNED</div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.plannedArr} innerRadius={55} outerRadius={75} dataKey="value" stroke="none">
                    {stats.plannedArr.map((_, i) => <Cell key={i} fill={COLORS_PLANNED[i % COLORS_PLANNED.length]} />)}
                    <Label value={formatTime(stats.pSum)} position="center" fill="#fff" className="center-label" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(v) => formatTime(v)} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-item">
            <div className="chart-label"><CheckCircle size={14}/> COMPLETED</div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.completedArr} innerRadius={55} outerRadius={75} dataKey="value" stroke="none">
                    {stats.completedArr.map((_, i) => <Cell key={i} fill={COLORS_COMPLETED[i % COLORS_COMPLETED.length]} />)}
                    <Label value={formatTime(stats.cSum)} position="center" fill="#fff" className="center-label" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(v) => formatTime(v)} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySummary;