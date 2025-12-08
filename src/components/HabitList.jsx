export default function HabitList({ habits, onToggle, onDelete }) {
  return (
    <ul className="space-y-3">
      {habits.map((habit) => (
        <li
          key={habit.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={habit.completed}
              onChange={() => onToggle(habit.id)}
              className="w-5 h-5 cursor-pointer"
            />
            <div>
              <span className={habit.completed ? "line-through text-gray-500" : ""}>
                {habit.name}
              </span>
              <p className="text-sm text-gray-600">
                🔥 Streak: {habit.streak || 0} Days
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(habit.id)}
            className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}