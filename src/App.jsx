import { useState, useEffect, useRef } from "react";
import HabitInput from "./components/HabitInput";
import HabitList from "./components/HabitList";
import WeeklyStats from "./components/WeeklyStats";
import "./index.css";

export default function App() {
  const [habits, setHabits] = useState([]);
  const today = new Date().toDateString();
  const [history, setHistory] = useState([{ date: today, completed: 0, total: 0 }]);
  
  const playSound = (type) => {
    let src = '';
    switch(type) {
      case 'add': src = 'add.mp3'; break;
      case 'delete': src = 'delete.mp3'; break;
      case 'toggle': src = 'toggle.mp3'; break;
      case 'celebrate': src = 'celebration.mp3'; break;
      default: src = ''; 
    }
    try {
      const audio = new Audio(src);
      audio.volume = 1;
      audio.play().catch(() => {});
    } catch(e) {}
  };

  // === Load habits from localStorage ===
  useEffect(() => {
    const saved = localStorage.getItem("habits");
    if (saved) {
      const parsedHabits = JSON.parse(saved);
      const updatedHabits = parsedHabits.map((h) =>
        h.lastCompleted !== today ? { ...h, completed: false } : h
      );
      setHabits(updatedHabits);
    }
  }, []);

  // === Save habits to localStorage ===
  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  // === Calculate progress ===
  const completedCount = habits.filter((h) => h.completed).length;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  // === Update daily history ===
  useEffect(() => {
    if (!history.some((record) => record.date === today)) {
      setHistory((prev) => [...prev, { date: today, completed: completedCount, total: totalHabits }]);
    } else {
      setHistory((prev) =>
        prev.map((record) =>
          record.date === today
            ? { ...record, completed: completedCount, total: totalHabits }
            : record
        )
      );
    }
  }, [habits]);

  // === Celebration sound when 100% ===
  useEffect(() => {
    if (progress === 100 && habits.length > 0) {
      setTimeout(() => {
        playSound('celebrate');
      }, 100);
    }
  }, [progress]);

  // === Habit actions ===
  function addHabit(name) {
    const newHabit = {
      id: Date.now(),
      name,
      completed: false,
      streak: 0,
      lastCompleted: null,
    };
    setHabits([...habits, newHabit]);
    playSound('add');
  }

  function editHabit(id, newName) {
    setHabits(
      habits.map((habit) => (habit.id === id ? { ...habit, name: newName } : habit))
    );
  }

  function toggleHabit(id) {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const today = new Date().toDateString();
          let newCompleted = !habit.completed;
          let newStreak = habit.streak || 0;

          if (newCompleted && habit.lastCompleted !== today) newStreak += 1;
          else if (!newCompleted && habit.lastCompleted === today) newStreak = Math.max(0, newStreak - 1);

          playSound('toggle');

          return {
            ...habit,
            completed: newCompleted,
            streak: newStreak,
            lastCompleted: newCompleted ? today : habit.lastCompleted,
          };
        }
        return habit;
      })
    );
  }

  function deleteHabit(id) {
    setHabits(habits.filter((h) => h.id !== id));
    playSound('delete');
  }

  // === Render ===
  return (
    <div className="container">
      <div className="card">
        <div className="app-container">
          <div className="inner-container">
            <h1 className="app-title">HABIT TRACKER</h1>
            <p style={{ fontWeight: "bold", color: "white" }}>
              Progress Today: {progress}% ({completedCount} / {totalHabits})
            </p>

            {progress === 100 && (
              <div className="celebration">
                🎉 Abaaaa nice !, You completed all your habits today! 🎉
              </div>
            )}

            <HabitInput onAdd={addHabit} />
            <WeeklyStats history={history} />

            <div className="habit-list-wrapper">
              <HabitList
                habits={habits}
                onToggle={toggleHabit}
                onDelete={deleteHabit}
                onEdit={editHabit}
              />
              {habits.length === 0 && (
                <p className="text-center text-gray-500 mt-4">
                  No habits yet. Add one to get started!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
