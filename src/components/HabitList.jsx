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

                <p className="habit-card-info">
                  {habit.isDueToday ? (
                    <span className="streak-label">Streak: {habit.streak} {habit.streak === 1 ? "Day" : "Days"}</span>
                  ) : (
                    <span className="not-due-label">Not scheduled for today</span>
                  )}
                </p>
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
    onEdit(habit._id, name);
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