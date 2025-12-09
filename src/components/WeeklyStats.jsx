import React from "react";

export default function WeeklyStats({ history }) {
  if (!history || history.length === 0) {
    return <p>No history yet.</p>;
  }

  // Get last 7 days
  const last7Days = history.slice(-7);

  return (
    <div className="weekly-stats">
      <h3>📈 Weekly Stats</h3>
      <ul>
        {last7Days.map((day) => (
          <li key={day.date}>
            <strong>{day.date}:</strong> {day.completed}/{day.total} habits completed
          </li>
        ))}
      </ul>
    </div>
  );
}
