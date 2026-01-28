import { useState, useEffect } from "react";
import HabitInput from "./components/HabitInput";
import HabitList from "./components/HabitList";
import ContributionCalendar from "./components/ContributionCalendar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import VerifyEmail from "./components/Auth/VerifyEmail";
import GoalList from "./components/GoalList";
import Leaderboard from "./components/Leaderboard";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import "./index.css";
import { useAuth } from "./hooks/useAuth";
import { useHabits } from "./hooks/useHabits";

export default function App() {
  const {
    user, setUser, authStep, setAuthStep, tempAuthData, setTempAuthData, logout
  } = useAuth();

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const {
    habits, history, togglingIds, addHabit, editHabit, toggleHabit, deleteHabit, refreshHabits, setHabits, setHistory
  } = useHabits(user);

  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [activeTab, setActiveTab] = useState("home");

  // Recalculate progress when habits change
  useEffect(() => {
    const dueToday = habits.filter((h) => h.isDueToday);
    const completed = dueToday.filter((h) => h.completedToday).length;
    const total = dueToday.length;
    setCompletedCount(completed);
    setTotalHabits(total);
    setProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
  }, [habits]);

  // Play celebration sound when all habits completed
  useEffect(() => {
    if (progress === 100 && habits.length > 0) {
      const audio = new Audio("celebration.mp3");
      audio.play().catch(() => { });
    }
  }, [progress, habits.length]);

  const handleLogout = () => {
    logout();
    setHabits([]);
    setHistory([]);
  };

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
                    refreshHabits();
                  }}
                  onSwitchToRegister={() => setAuthStep("register")}
                  onForgotPassword={() => setAuthStep("forgot-password")}
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
                    refreshHabits();
                  }}
                />
              )}

              {authStep === "forgot-password" && (
                <ForgotPassword
                  onCodeSent={(email) => {
                    setTempAuthData({ email });
                    setAuthStep("reset-password");
                  }}
                  onBackToLogin={() => setAuthStep("login")}
                />
              )}

              {authStep === "reset-password" && tempAuthData && (
                <ResetPassword
                  email={tempAuthData.email}
                  onResetSuccess={(msg) => {
                    alert(msg);
                    setAuthStep("login");
                  }}
                  onBackToLogin={() => setAuthStep("login")}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="habit-app-root">
        <div className="app-container">
          <div className="inner-container">
            <div className="app-header">
              <div className="header-top">
                <div className="user-greeting">
                  <p className="greeting-text">{greeting}, <strong>{user.username}</strong></p>
                </div>
                <button onClick={handleLogout} className="logout-pill">
                  Logout
                </button>
              </div>

              <div className="app-title-container">
                <h1 className="app-title">
                  Ha<strong>BITAW</strong>
                </h1>
                <p className="app-subtitle">Bitaw Gusto, Disiplina Ayaw?</p>
              </div>

              <div className="progress-summary-card">
                <div className="progress-info">
                  <h3>Today's Progress</h3>
                  <div className="progress-stats">
                    <span className="stats-main">{completedCount} / {totalHabits}</span>
                    <span className="stats-sub">Habits Done</span>
                  </div>
                </div>
                <div className="progress-circle-container">
                  <svg className="progress-circle" viewBox="0 0 36 36">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle"
                      strokeDasharray={`${progress}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage">{progress}%</text>
                  </svg>
                </div>
              </div>
            </div>

            {progress === 100 && habits.length > 0 && (
              <div className="celebration">
                🎉 Abaaaa nice!, You completed all your habits today! 🎉
              </div>
            )}

            {activeTab === "home" && (
              <>
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

            {activeTab === "add" && (
              <div className="add-habit-page">
                <h2 className="page-title">New Habit</h2>
                <HabitInput onAdd={(data) => {
                  addHabit(data);
                  setActiveTab("home");
                }} />
                <button
                  className="cancel-btn"
                  onClick={() => setActiveTab("home")}
                >
                  Cancel
                </button>
              </div>
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

              <button
                className={`nav-add-btn ${activeTab === "add" ? "active" : ""}`}
                onClick={() => setActiveTab("add")}
              >
                <span className="plus-icon">+</span>
              </button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
