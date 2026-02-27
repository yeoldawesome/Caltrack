import React from 'react';


// Always treat week as Monday-Sunday, and use only the date part (ignore time)
function getStartOfWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  // Monday = 1, Sunday = 0
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
}

function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
}

export default function WeeklyCount({ entries, dailyLimit }) {

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = getEndOfWeek(today);

  // Use only the date part (YYYY-MM-DD) for grouping, as in DB
  function getYMD(date) {
    if (typeof date === 'string') return date.slice(0, 10);
    return date.toISOString().slice(0, 10);
  }

  // Get all days in this week (YYYY-MM-DD)
  const weekDays = [];
  for (let i = 0; i < 7; ++i) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDays.push(getYMD(d));
  }

  // Group entries by date string (YYYY-MM-DD)
  const dailyTotals = Array(7).fill(0);
  entries.forEach(e => {
    const entryDay = getYMD(e.date);
    const idx = weekDays.indexOf(entryDay);
    if (idx !== -1) {
      dailyTotals[idx] += Number(e.calories) || 0;
    }
  });

  const weekTotal = dailyTotals.reduce((a, b) => a + b, 0);
  const weekLimit = dailyLimit * 7;
  const weekRemaining = weekLimit - weekTotal;

  // Calculate remaining per day for rest of week
  let todayIdx = todayUTC.getUTCDay();
  todayIdx = (todayIdx + 6) % 7;
  const daysLeft = 6 - todayIdx;
  const calsLeftPerDay = daysLeft > 0 ? Math.floor(weekRemaining / (daysLeft + 1)) : weekRemaining;

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <h2>Weekly Calorie Count</h2>
      <div>Total allowed: <b>{weekLimit}</b></div>
      <div>Consumed so far: <b>{weekTotal}</b></div>
      <div>Remaining this week: <b>{weekRemaining}</b></div>
      <hr />
      <h4>Per Day (Mon-Sun):</h4>
      <ul style={{ paddingLeft: 20 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
          <li key={d} style={{ fontWeight: i === todayIdx ? 'bold' : 'normal' }}>
            {d}: {dailyTotals[i]} / {dailyLimit} &nbsp;
            {i === todayIdx ? <span>(Today)</span> : null}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16 }}>
        <b>Avg left per day (rest of week): {calsLeftPerDay}</b>
      </div>
    </div>
  );
}
