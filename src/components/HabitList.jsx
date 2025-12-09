import{useState} from "react"
import fire2 from "../assets/fire/fire2.png";
import fire3 from "../assets/fire/fire3.png";
import fire4 from "../assets/fire/fire4.png";
import fire5 from "../assets/fire/fire5.png";


export default function HabitList({ habits, onToggle, onDelete, onEdit }) {
  return (
    <ul className="habit-list">
      {habits.map((habit) => (
        <li key={habit.id}>
          <div className="fire-streak">
  {getFireImages(habit.streak).map((img, i) => (
    <img
      key={i}
      src={img}
      alt="fire"
      className="fire-icon"
    />
  ))}
</div>

<div className="habit-item-container">
  <input
    type="checkbox"
    checked={habit.completed}
    onChange={() => onToggle(habit.id)}
    className="habit-checkbox"
    />
            
<div className="habit-text">
    <EditableHabitName habit={habit} onEdit={onEdit} />
    
      <p className="streak">
      Streak: {habit.streak }{habit.streak === 1 ? " Day " : " Days "}
      </p>
    </div>
    </div>  

 <button
   onClick={() => onDelete(habit.id)}
   className="deleteHabit"
    >
  ✕
  </button>
  </li>
  ))}
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
    onEdit(habit.id, name); // send new name to App
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
      style={{ marginLeft: "8px" }}
    />
  ) : (
    <span
      style={{ marginLeft: "8px", cursor: "pointer",  textDecoration: habit.completed ? "line-through" : "none",
    color: habit.completed ? "gray" : "white",}}
      onClick={() => setIsEditing(true)}
    >
      {habit.name}
    </span>
  );
}