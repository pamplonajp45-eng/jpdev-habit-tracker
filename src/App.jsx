import { useState, useEffect } from "react";
import HabitInput from "./components/HabitInput";
import HabitList from "./components/HabitList";
import ContributionCalendar from "./components/ContributionCalendar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import VerifyEmail from "./components/Auth/VerifyEmail";
import GoalList from "./components/GoalList";
import Leaderboard from "./components/Leaderboard";
import api from "./utils/api";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [authStep, setAuthStep] = useState('login'); // login, register, verify
  const [tempAuthData, setTempAuthData] = useState(null); // { userId, email } for verification

  const [habits, setHabits] = useState([]);
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [togglingIds, setTogglingIds] = useState(new Set());

  // Check for existing token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Ideally verify token with an endpoint like /api/auth/me, but simple check for now
        setUser({ loggedIn: true });
        fetchData();
      }
    };
    checkAuth();
  }, []);

  const fetchData = async () => {
    try {
      const [habitsRes, heatmapRes] = await Promise.all([
        api.get('/habits'),
        api.get('/heatmap')
      ]);
      setHabits(habitsRes.data);
      setHistory(heatmapRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  // Recalculate progress when habits change
  useEffect(() => {
    const completed = habits.filter((h) => h.completedToday).length;
    const total = habits.length;
    setCompletedCount(completed);
    setTotalHabits(total);
    setProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
  }, [habits]);


  const playSound = (type) => {
    let src = '';
    switch (type) {
      case 'add': src = 'add.mp3'; break;
      case 'delete': src = 'delete.mp3'; break;
      case 'toggle': src = 'toggle.mp3'; break;
      case 'celebrate': src = 'celebration.mp3'; break;
      default: src = '';
    }
    try {
      const audio = new Audio(src);
      audio.volume = 1;
      audio.play().catch(() => { });
    } catch (e) { }
  };

  useEffect(() => {
    if (progress === 100 && habits.length > 0) {
      setTimeout(() => {
        playSound('celebrate');
      }, 100);
    }
  }, [progress]);


  async function addHabit(name) {
    try {
      const res = await api.post('/habits', { name });
      // The backend returns the new habit. We need to respect the frontend structure or adapt.
      // Backend habit needs 'completedToday' which is false by default.
      setHabits(prev => [{ ...res.data, completedToday: false }, ...prev]);
      playSound('add');
    } catch (err) {
      console.error("Failed to add habit", err);
    }
  }

  async function editHabit(id, newName) {
    try {
      const res = await api.put(`/habits/${id}`, { name: newName });
      setHabits(habits.map((habit) => (habit._id === id ? { ...habit, name: res.data.name } : habit)));
    } catch (err) {
      console.error("Failed to edit habit", err);
    }
  }

  async function toggleHabit(id) {
    // 1. Optimistic Update
    const originalHabits = [...habits];
    const targetHabit = habits.find(h => h._id === id);

    if (!targetHabit) return;

    // Add to togglingIds to disable interaction
    setTogglingIds(prev => new Set(prev).add(id));

    // Optimistically toggle the local state
    const isNowCompleted = !targetHabit.completedToday;
    const optimisticStreak = isNowCompleted
      ? targetHabit.streak + 1 // If we are checking it, streak likely goes up (simplified logic for UI feedback)
      : Math.max(0, targetHabit.streak - 1); // If unchecking, streak might go down

    setHabits(habits.map(h =>
      h._id === id
        ? { ...h, completedToday: isNowCompleted, streak: optimisticStreak }
        : h
    ));

    // Play sound immediately for better feedback
    if (isNowCompleted) playSound('toggle');

    try {
      // 2. Network Request
      const res = await api.post(`/habits/${id}/toggle`);
      const updatedHabit = res.data.habit;
      const serverCompletedStatus = res.data.message === 'Habit checked';

      // 3. Reconcile with Server Data (if needed)
      // Usually the optimistic state matches, but we sync just to be safe with the exact streak from server
      setHabits(currentHabits => currentHabits.map((h) =>
        h._id === id
          ? { ...h, completedToday: serverCompletedStatus, streak: updatedHabit.streak }
          : h
      ));

      // Refresh heatmap
      const heatmapRes = await api.get('/heatmap');
      setHistory(heatmapRes.data);

    } catch (err) {
      console.error("Failed to toggle habit", err);
      // 4. Rollback on Error
      setHabits(originalHabits);
      alert("Failed to update habit. Please try again.");
    } finally {
      // Remove from togglingIds
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function deleteHabit(id) {
    try {
      await api.delete(`/habits/${id}`);
      setHabits(habits.filter((h) => h._id !== id));
      playSound('delete');
      // Refresh heatmap
      const heatmapRes = await api.get('/heatmap');
      setHistory(heatmapRes.data);
    } catch (err) {
      console.error("Failed to delete habit", err);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthStep('login');
    setHabits([]);
  }

  // Auth Handling
  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <div className="app-container">
            <div className="inner-container">
              <h1 className="app-title">Ha<strong>BITAW</strong></h1>
              <p className="app-subtitle">Bitaw Gusto, Disiplina Ayaw?</p>

              {authStep === 'login' && (
                <Login
                  onSuccess={(userData) => { setUser(userData); fetchData(); }}
                  onSwitchToRegister={() => setAuthStep('register')}
                />
              )}

              {authStep === 'register' && (
                <Register
                  onRegistered={(userId, email) => {
                    setTempAuthData({ userId, email });
                    setAuthStep('verify');
                  }}
                  onSwitchToLogin={() => setAuthStep('login')}
                />
              )}

              {authStep === 'verify' && tempAuthData && (
                <VerifyEmail
                  userId={tempAuthData.userId}
                  email={tempAuthData.email}
                  onSuccess={(userData) => { setUser(userData); fetchData(); }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="app-container">
          <div className="inner-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="app-title" style={{ margin: 0 }}>Ha<strong>BITAW</strong> </h1>
              <button onClick={handleLogout} className="habit-submit" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Logout</button>
            </div>

            <p className="app-subtitle">Bitaw Gusto, Disiplina Ayaw?</p>
            <p style={{ textAlign: "center", margin: "1rem 10px", fontWeight: "bold", color: "white" }}>
              Progress Today: {progress}% ({completedCount} / {totalHabits})
            </p>

            {progress === 100 && (
              <div className="celebration">
                🎉 Abaaaa nice !, You completed all your habits today! 🎉
              </div>
            )}

            <HabitInput onAdd={addHabit} />
            <ContributionCalendar history={history} />

            <div className="dashboard-grid">
              <GoalList habits={habits} />
              <Leaderboard />
            </div>

            <div className="habit-list-wrapper" style={{ marginTop: '1.5rem' }}>
              <HabitList
                habits={habits}
                onToggle={toggleHabit}
                onDelete={deleteHabit}
                onEdit={editHabit}
                togglingIds={togglingIds}
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
