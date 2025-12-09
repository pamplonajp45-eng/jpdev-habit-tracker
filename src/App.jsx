import { useState, useEffect } from "react";
import HabitInput from "./components/HabitInput";
import HabitList from "./components/HabitList";
import "./index.css";
import WeeklyStats from "./components/WeeklyStats";

export default function App() {
  const [habits, setHabits] = useState([]);
  const today = new Date().toDateString();
  const [history, setHistory] = useState([{ date: today, completed: 0, total: 0 }]);


useEffect(() => {
    const saved = localStorage.getItem("habits");
    if (saved) {
    const parsedHabits = JSON.parse(saved);
    const updatedHabits = parsedHabits.map((h) => {
    if (h.lastCompleted !== today) {
    return { ...h, completed: false };
    }
    return h;
      });
      setHabits(updatedHabits);
    }
  }, []);

 
useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem("habits", JSON.stringify(habits));
    }
  }, [habits]);

  const completedCount = habits.filter((h) => h.completed).length;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

useEffect(() => {
    if (!history.some((record) => record.date === today)) {
      const newRecord = {
        date: today,
        completed: completedCount,
        total: totalHabits,
      };
      setHistory((prev) => [...prev, newRecord]);
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

  function editHabit(id, newName) {
    setHabits(
      habits.map((habit) =>
        habit.id === id ? { ...habit, name: newName } : habit
      )
    );
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
          } else if (!newCompleted && habit.lastCompleted === today) {
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
