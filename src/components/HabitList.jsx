import { useState } from "react"
import fire2 from "../assets/fire/fire2.png";
import fire3 from "../assets/fire/fire3.png";
import fire4 from "../assets/fire/fire4.png";
import fire5 from "../assets/fire/fire5.png";

const habitColors = [
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#3b82f6"  // Blue
];

export default function HabitList({ habits, onToggle, onDelete, onEdit, togglingIds }) {
  return (
    <ul className="habit-list">
      {habits.map((habit, index) => {
        const color = habitColors[index % habitColors.length];
        return (
          <li
            key={habit._id}
            className={`habit-card ${habit.completedToday ? "completed" : ""}`}
            style={{ "--habit-color": color }}
          >
            <div className={`habit-card-content ${!habit.isDueToday ? 'not-due' : ''}`}>
              <div className="habit-card-left">
                <div className="habit-icon-circle" style={{ backgroundColor: color }}>
                  {habit.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="habit-card-middle">
                <div className="habit-title-row">
                  <EditableHabitName habit={habit} onEdit={onEdit} color={color} />
                  <div className="fire-streak-mini">
                    {getFireImages(habit.streak).map((img, i) => (
                      <img key={i} src={img} alt="fire" className="fire-icon-small" />
                    ))}
                  </div>
                </div>

                <div className="habit-meta-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <p className="habit-card-info" style={{ margin: 0 }}>
                    {habit.isDueToday ? (
                      <span className="streak-label">Streak: {habit.streak} {habit.streak === 1 ? "Day" : "Days"}</span>
                    ) : (
                      <span className="not-due-label">Not scheduled for today</span>
                    )}
                  </p>
                  <EditableReminderTime habit={habit} onEdit={onEdit} />
                </div>
              </div>

              <div className="habit-card-right">
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={habit.completedToday}
                    onChange={() => onToggle(habit._id)}
                    className="habit-checkbox-custom"
                    disabled={(togglingIds && togglingIds.has(habit._id)) || !habit.isDueToday}
                    id={`habit-${habit._id}`}
                  />
                  <label htmlFor={`habit-${habit._id}`} className="checkbox-ui" style={{ borderColor: color }}>
                    <span className="check-mark" style={{ backgroundColor: color }}>✓</span>
                  </label>
                </div>

                <button
                  onClick={() => onDelete(habit._id)}
                  className="delete-btn-mini"
                  aria-label="Delete habit"
                >
                  ✕
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function getFireImages(streak) {
  const fireImages = [];
  if (streak <= 0) return fireImages;
  if (streak <= 3) fireImages.push(fire2);
  else if (streak <= 6) fireImages.push(fire3);
  else if (streak <= 9) fireImages.push(fire4);
  else fireImages.push(fire5);
  return fireImages;
}

function EditableHabitName({ habit, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(habit.name);

  const handleBlur = () => {
    if (name !== habit.name) {
      onEdit(habit._id, { name: name });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setName(habit.name);
      setIsEditing(false);
    }
  };

  return isEditing ? (
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
      className="editing-input"
    />
  ) : (
    <span
      className={`habit-name-text ${habit.completedToday ? "checked" : ""}`}
      onClick={() => setIsEditing(true)}
    >
      {habit.name}
    </span>
  );
}

function EditableReminderTime({ habit, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [time, setTime] = useState(habit.reminderTime || "09:00");

  const handleChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    onEdit(habit._id, { reminderTime: newTime });
    setIsEditing(false);
  };

  return (
    <div className="editable-reminder">
      {isEditing ? (
        <input
          type="time"
          value={time}
          onChange={handleChange}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="reminder-edit-input"
        />
      ) : (
        <span
          className="reminder-badge"
          onClick={() => setIsEditing(true)}
          title="Click to change reminder time"
          style={{
            fontSize: '0.7rem',
            background: 'rgba(99,102,241,0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            color: '#818cf8',
            cursor: 'pointer',
            border: '1px solid rgba(99,102,241,0.2)'
          }}
        >
          🔔 {habit.reminderTime || "09:00"}
        </span>
      )}
    </div>
  );
}