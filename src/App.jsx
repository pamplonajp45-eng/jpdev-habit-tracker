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
  const [authStep, setAuthStep] = useState("login");
  const [tempAuthData, setTempAuthData] = useState(null);

  const [habits, setHabits] = useState([]);
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("home");

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        setUser({ loggedIn: true });
        fetchData();
      }
    };
    checkAuth();
  }, []);

  const fetchData = async () => {
    try {
      const [habitsRes, heatmapRes] = await Promise.all([
        api.get("/habits"),
        api.get("/heatmap"),
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
    const soundMap = {
      add: "add.mp3",
      delete: "delete.mp3",
      toggle: "toggle.mp3",
      celebrate: "celebration.mp3",
    };

    const src = soundMap[type];
    if (!src) return;

    try {
      const audio = new Audio(src);
      audio.volume = 1;
      audio.play().catch(() => {});
    } catch (e) {
      // Silently fail if audio can't play
    }
  };

  // Play celebration sound when all habits completed
  useEffect(() => {
    if (progress === 100 && habits.length > 0) {
      setTimeout(() => playSound("celebrate"), 100);
    }
  }, [progress, habits.length]);

  async function addHabit(name) {
    try {
      const res = await api.post("/habits", { name });
      setHabits((prev) => [{ ...res.data, completedToday: false }, ...prev]);
      playSound("add");
    } catch (err) {
      console.error("Failed to add habit", err);
    }
  }

  async function editHabit(id, newName) {
    try {
      const res = await api.put(`/habits/${id}`, { name: newName });
      setHabits((prev) =>
        prev.map((habit) =>
          habit._id === id ? { ...habit, name: res.data.name } : habit,
        ),
      );
    } catch (err) {
      console.error("Failed to edit habit", err);
    }
  }

  async function toggleHabit(id) {
    const originalHabits = [...habits];
    const targetHabit = habits.find((h) => h._id === id);

    if (!targetHabit) return;

    setTogglingIds((prev) => new Set(prev).add(id));

    const isNowCompleted = !targetHabit.completedToday;
    const optimisticStreak = isNowCompleted
      ? targetHabit.streak + 1
      : Math.max(0, targetHabit.streak - 1);

    setHabits((prev) =>
      prev.map((h) =>
        h._id === id
          ? { ...h, completedToday: isNowCompleted, streak: optimisticStreak }
          : h,
      ),
    );

    if (isNowCompleted) playSound("toggle");

    try {
      const res = await api.post(`/habits/${id}/toggle`);
      const updatedHabit = res.data.habit;
      const serverCompletedStatus = res.data.message === "Habit checked";

      setHabits((prev) =>
        prev.map((h) =>
          h._id === id
            ? {
                ...h,
                completedToday: serverCompletedStatus,
                streak: updatedHabit.streak,
              }
            : h,
        ),
      );

      const heatmapRes = await api.get("/heatmap");
      setHistory(heatmapRes.data);
    } catch (err) {
      console.error("Failed to toggle habit", err);
      setHabits(originalHabits);
      alert("Failed to update habit. Please try again.");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function deleteHabit(id) {
    const originalHabits = [...habits];

    setHabits((prev) => prev.filter((h) => h._id !== id));
    playSound("delete");

    try {
      await api.delete(`/habits/${id}`);
      const heatmapRes = await api.get("/heatmap");
      setHistory(heatmapRes.data);
    } catch (err) {
      console.error("Failed to delete habit", err);
      setHabits(originalHabits);
      alert("Failed to delete habit. Please try again.");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setAuthStep("login");
    setHabits([]);
    setHistory([]);
  };

  // Authentication screens
  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <div className="app-container">
            <div className="inner-container">
              <h1 className="app-title">
                Ha<strong>BITAW</strong>
              </h1>
              <p className="app-subtitle">Bitaw Gusto, Disiplina Ayaw?</p>

              {authStep === "login" && (
                <Login
                  onSuccess={(userData) => {
                    setUser(userData);
                    fetchData();
                  }}
                  onSwitchToRegister={() => setAuthStep("register")}
                />
              )}

              {authStep === "register" && (
                <Register
                  onRegistered={(userId, email) => {
                    setTempAuthData({ userId, email });
                    setAuthStep("verify");
                  }}
                  onSwitchToLogin={() => setAuthStep("login")}
                />
              )}

              {authStep === "verify" && tempAuthData && (
                <VerifyEmail
                  userId={tempAuthData.userId}
                  email={tempAuthData.email}
                  onSuccess={(userData) => {
                    setUser(userData);
                    fetchData();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="container">
      <div className="card">
        <div className="app-container">
          <div className="inner-container">
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h1 className="app-title" style={{ margin: 0 }}>
                Ha<strong>BITAW</strong>
              </h1>
              <button
                onClick={handleLogout}
                className="habit-submit"
                style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
              >
                Logout
              </button>
            </div>

            <p className="app-subtitle">Bitaw Gusto, Disiplina Ayaw?</p>

            {/* Progress Bar */}
            <p
              style={{
                textAlign: "center",
                margin: "1rem 10px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              Progress Today: {progress}% ({completedCount} / {totalHabits})
            </p>

            {/* Celebration Message */}
            {progress === 100 && habits.length > 0 && (
              <div className="celebration">
                🎉 Abaaaa nice!, You completed all your habits today! 🎉
              </div>
            )}

            {/* Tab Content */}
            {activeTab === "home" && (
              <>
                <HabitInput onAdd={addHabit} />
                <ContributionCalendar history={history} />

                <div
                  className="habit-list-wrapper"
                  style={{ marginTop: "1.5rem" }}
                >
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
              </>
            )}

            {activeTab === "goals" && <GoalList habits={habits} />}
            {activeTab === "leaderboard" && <Leaderboard />}

            <div className="bottom-nav">
              <button
                className={activeTab === "home" ? "active" : ""}
                onClick={() => setActiveTab("home")}
                data-icon="🏠"
              >
                Home
              </button>
              <button
                className={activeTab === "goals" ? "active" : ""}
                onClick={() => setActiveTab("goals")}
                data-icon="🎯"
              >
                Goals
              </button>
              <button
                className={activeTab === "leaderboard" ? "active" : ""}
                onClick={() => setActiveTab("leaderboard")}
                data-icon="🏆"
              >
                Rank
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
