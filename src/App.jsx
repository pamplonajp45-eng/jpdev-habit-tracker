import { useState, useEffect } from "react";
import HabitInput from "./components/HabitInput";
import HabitList from "./components/HabitList";
import "./index.css"

export default function App() {
  const [habits, setHabits] = useState([]);

  // Load habits from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("habits");
    if (saved) {
      const parsedHabits = JSON.parse(saved);
      const today = new Date().toDateString();
      const updatedHabits = parsedHabits.map((h) => {
        if (h.lastCompleted !== today) {
          return { ...h, completed: false };
        }
        return h;
      });
      setHabits(updatedHabits);
    }
  }, []);

  // Save habits to localStorage whenever they change
  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem("habits", JSON.stringify(habits));
    }
  }, [habits]);

  function addHabit(name) {
    const newHabit = {
      id: Date.now(),
      name,
      completed: false,
      streak: 0,
      lastCompleted: null,
    };
    setHabits([...habits, newHabit]);
  }

  function toggleHabit(id) {
    const today = new Date().toDateString();
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          let newStreak = habit.streak || 0;
          let newCompleted = !habit.completed;

         
          if (newCompleted && habit.lastCompleted !== today) {
            newStreak += 1;
          }
          
          else if (!newCompleted && habit.lastCompleted === today) {
            newStreak = Math.max(0, newStreak - 1);
          }

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
  }

  return (
    <div className = "container">
    <div className = "card">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🎯 HABIT TRACKER
        </h1>
        <div className="bg-gray-50 p-6 rounded-xl shadow-lg">
          <HabitInput onAdd={addHabit} />
          <HabitList
            habits={habits}
            onToggle={toggleHabit}
            onDelete={deleteHabit}
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