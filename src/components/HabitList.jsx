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
  const [editingHabitId, setEditingHabitId] = useState(null);

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
                  <EditableHabitName
                    habit={habit}
                    onEdit={(id, name, category) => {
                      onEdit(id, name, category);
                      setEditingHabitId(null);
                    }}
                    color={color}
                    isEditing={editingHabitId === habit._id}
                    onStartEdit={() => setEditingHabitId(habit._id)}
                    onCancelEdit={() => setEditingHabitId(null)}
                  />
                  {editingHabitId !== habit._id && (
                    <div className="fire-streak-mini">
                      {getFireImages(habit.streak).map((img, i) => (
                        <img key={i} src={img} alt="fire" className="fire-icon-small" />
                      ))}
                    </div>
                  )}
                </div>

                <p className="habit-card-info">
                  {habit.isDueToday ? (
                    <span className="streak-label">Streak: {habit.streak} {habit.streak === 1 ? "Day" : "Days"}</span>
                  ) : (
                    <span className="not-due-label">Not scheduled for today</span>
                  )}
                </p>
              </div>

              {editingHabitId !== habit._id && (
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
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this habit? All streaks and history will be lost. This cannot be undone.")) {
                        onDelete(habit._id);
                      }
                    }}
                    className="delete-btn-mini"
                    aria-label="Delete habit"
                  >
                    ✕
                  </button>
                </div>
              )}
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

function EditableHabitName({ habit, onEdit, isEditing, onStartEdit, onCancelEdit }) {
  const [name, setName] = useState(habit.name);
  const [category, setCategory] = useState(habit.category || "");

  const handleSave = () => {
    onEdit(habit._id, name, category);
  };

  const handleCancel = () => {
    setName(habit.name);
    setCategory(habit.category || "");
    onCancelEdit();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return isEditing ? (
    <div className="inline-edit-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', width: '100%', marginRight: '30px' }}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="editing-input"
        style={{ flex: '1 1 100%', minWidth: '120px' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap' }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-dropdown-inline"
          style={{
            background: "rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "8px",
            fontSize: "0.8rem",
            flex: '1',
            minWidth: '80px'
          }}
        >
          <option value="" disabled>Category</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
          <option value="relationship">Relationship</option>
          <option value="self-care">Self-care</option>
          <option value="hobby">Hobby</option>
          <option value="sports">Sports</option>
          <option value="work">Work</option>
          <option value="study">Study</option>
          <option value="self-improvement">Self-improvement</option>
        </select>
        <button onClick={handleSave} style={{ background: '#6366f1', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.5rem' }}>Save</button>
        <button onClick={handleCancel} style={{ background: 'transparent', border: '1px solid #4f46e5', color: '#a0a0b8', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.5rem' }}>✕</button>
      </div>
    </div>
  ) : (
    <span
      className={`habit-name-text ${habit.completedToday ? "checked" : ""}`}
      onClick={() => onStartEdit()}
    >
      {habit.name}
    </span>
  );
}