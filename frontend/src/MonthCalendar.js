import React from 'react';

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

export default function MonthCalendar({ year, month, selectedDate, onSelect, onPrev, onNext, entries = [], dailyLimit = 2000 }) {
  const days = getMonthDays(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().slice(0, 10);
  // Map dateStr to total calories for that day
  const caloriesByDate = {};
  entries.forEach(e => {
    if (!e.date) return;
    const dateStr = e.date.slice(0, 10);
    caloriesByDate[dateStr] = (caloriesByDate[dateStr] || 0) + Number(e.calories || 0);
  });
  return (
    <div style={{ background: '#23272b', borderRadius: 12, padding: 16, minWidth: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={onPrev} style={{ background: 'none', border: 'none', color: '#4fd1c5', fontSize: 20, cursor: 'pointer' }}>&lt;</button>
        <span style={{ fontWeight: 600, color: '#4fd1c5' }}>
          {new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={onNext} style={{ background: 'none', border: 'none', color: '#4fd1c5', fontSize: 20, cursor: 'pointer' }}>&gt;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4, color: '#aaa', fontWeight: 500 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array(firstDayOfWeek).fill(null).map((_, i) => <div key={'empty'+i}></div>)}
        {days.map(d => {
          const dateStr = d.toISOString().slice(0, 10);
          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;
          const totalCals = caloriesByDate[dateStr];
          let bg = isSelected ? '#4fd1c5' : isToday ? '#2d3237' : '#181c20';
          let color = isSelected ? '#181c20' : isToday ? '#4fd1c5' : '#f5f6fa';
          if (totalCals !== undefined) {
            if (totalCals <= dailyLimit) bg = '#22c55e'; // green
            if (totalCals > dailyLimit) bg = '#ef4444'; // red
            if (isSelected) bg = '#4fd1c5';
            if (isSelected) color = '#181c20';
          }
          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              style={{
                padding: 0,
                aspectRatio: '1/1',
                borderRadius: 6,
                border: isSelected ? '2px solid #4fd1c5' : '1px solid #353b41',
                background: bg,
                color: color,
                fontWeight: isSelected ? 700 : 400,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
