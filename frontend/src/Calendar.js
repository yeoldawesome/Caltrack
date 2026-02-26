// Simple calendar component for date selection
import React from 'react';

export default function Calendar({ selectedDate, onChange }) {
  // Show a week view for simplicity
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i); // Sunday to Saturday
    return d;
  });
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {days.map((d) => {
        const dateStr = d.toISOString().slice(0, 10);
        const isSelected = selectedDate === dateStr;
        return (
          <button
            key={dateStr}
            onClick={() => onChange(dateStr)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: isSelected ? '2px solid #4fd1c5' : '1px solid #353b41',
              background: isSelected ? '#23272b' : '#181c20',
              color: isSelected ? '#4fd1c5' : '#f5f6fa',
              fontWeight: isSelected ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </button>
        );
      })}
    </div>
  );
}
