import { useState, useEffect } from "react";
import api from "./utils/api";
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
import XPBar from "./components/XPBar";
import BadgePopup from "./components/BadgePopup";
import BadgeCollection from "./components/BadgeCollection";
import ChatSystem from "./components/ChatSystem";
import { registerPush } from "./utils/push";
import homeIcon from "./assets/icons/home.png";
import goalsIcon from "./assets/icons/goals.png";
import rankIcon from "./assets/icons/rank.png";
import achievementsIcon from "./assets/icons/achievements.png";
import chatIcon from "./assets/icons/chat.png";
import addIcon from "./assets/icons/add.png";
import logoutIcon from "./assets/icons/logout.png";
import SharedHabits from "./components/SharedHabits";
import partyIcon from "./assets/icons/sharedHabits.png";
import SharedHabitCard from "./components/SharedHabitCard";
import HabitHistoryLog from "./components/HabitHistoryLog";
export default function App() {
  const {
    user,
    setUser,
    authStep,
    setAuthStep,
    tempAuthData,
    setTempAuthData,
    logout,
    loading,
  } = useAuth();


  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const {
    habits,
    history,
    togglingIds,
    addHabit,
    editHabit,
    toggleHabit,
    deleteHabit,
    updateHabitNote,
    refreshHabits,
    setHabits,
    setHistory,
    newBadge,
    setNewBadge,
  } = useHabits(user, setUser);

  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [invitations, setInvitations] = useState([]);
  const [sharedHabits, setSharedHabits] = useState([]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setIsChatOpen(false);
  };

  const handleHabitAdd = async (habitData) => {
    try {
      const newHabit = await addHabit(habitData);
      if (newHabit && newHabit.isShared) {
        setSharedHabits(prev => [...prev, newHabit]);
      }
    } catch (error) {
      console.error("Error adding habit:", error);
    }
  };

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [invitesRes, habitsRes] = await Promise.all([
            api.get("/shared-habits/invitations"),
            api.get("/shared-habits")
          ]);

          setInvitations(invitesRes.data);
          setSharedHabits(habitsRes.data);
        } catch (err) { console.error(err); }
      };
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Register for push notifications when user logs in
  useEffect(() => {
    if (user) {
      registerPush();
    }
  }, [user]);

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
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      setHabits([]);
      setHistory([]);
    }
  };

  const handleAcceptInvite = async (id) => {
    try {
      await api.post(`/shared-habits/${id}/accept`);
      // Refresh both
      const [invitesRes, habitsRes] = await Promise.all([
        api.get("/shared-habits/invitations"),
        api.get("/shared-habits")
      ]);
      setInvitations(invitesRes.data);
      setSharedHabits(habitsRes.data);
    } catch (err) { console.error(err); }
  };

  const handleRejectInvite = async (id) => {
    if (!window.confirm("Reject this invitation?")) return;
    try {
      await api.post(`/shared-habits/${id}/reject`);
      const res = await api.get("/shared-habits/invitations");
      setInvitations(res.data);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <div className="loading-screen">Loading HaBITAW...</div>;
  }

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
                  <p className="greeting-text">
                    {greeting}, <strong>{user.username}</strong>
                  </p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleLogout} className="logout-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}>
                    <img src={logoutIcon} alt="Logout" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                    Logout
                  </button>
                </div>
              </div>

              <div className="app-title-container">
                <h1 className="app-title">
                  Ha<strong>BITAW</strong>
                </h1>
                <p className="app-subtitle">Bitaw Gusto, Disiplina Ayaw?</p>
              </div>

              <XPBar
                currentXP={user.xp || 0}
                maxXP={(user.level || 1) * 100}
                level={user.level || 1}

              />

              <div className="progress-summary-card">
                <div className="progress-info">
                  <h3>Today's Progress</h3>
                  <div className="progress-stats">
                    <span className="stats-main">
                      {completedCount} / {totalHabits}
                    </span>
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
                    <text x="18" y="20.35" className="percentage">
                      {progress}%
                    </text>
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

                <div className="category-filter-container" style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                  {["All", "Shared", ...new Set(habits.map(h => h.category).filter(c => c && c !== "general"))].map(cat => (
                    <button
                      key={cat}
                      className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "0.4rem 1rem",
                        borderRadius: "20px",
                        border: "1px solid rgba(99,102,241,0.3)",
                        background: selectedCategory === cat ? "#6366f1" : "rgba(30,30,46,0.5)",
                        color: selectedCategory === cat ? "white" : "#a0a0b8",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        textTransform: "capitalize",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div
                  className="habit-list-wrapper"
                  style={{ marginTop: "1rem" }}
                >
                  {selectedCategory === "Shared" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {invitations.length > 0 && (
                        <div style={{ background: "rgba(99,102,241,0.05)", borderRadius: "16px", padding: "1rem", border: "1px dashed rgba(99,102,241,0.3)", marginBottom: "0.5rem" }}>
                          <p style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
                            📩 Pending Invitations ({invitations.length})
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {invitations.map(invite => (
                              <div key={invite._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "12px", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                  <span style={{ fontSize: "1.1rem" }}>{invite.emoji || "🤝"}</span>
                                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{invite.name}</span>
                                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{invite.frequency} • {invite.category}</span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button onClick={() => handleAcceptInvite(invite._id)} style={{ background: "#6366f1", color: "white", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Join</button>
                                  <button onClick={() => handleRejectInvite(invite._id)} style={{ background: "none", color: "#6b7280", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {sharedHabits.length === 0 && invitations.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>No active parties. Create one in the "+" tab!</p>
                      ) : (
                        sharedHabits.map(h => (
                          <SharedHabitCard
                            key={h._id}
                            habit={h}
                            currentUser={user}
                            onToggle={async (id, note) => {
                              try {
                                await api.post(`/shared-habits/${id}/toggle`, { note });
                                // Refresh
                                const res = await api.get("/shared-habits");
                                setSharedHabits(res.data);
                              } catch (err) { console.error(err); }
                            }}
                            onUpdateNote={async (id, note) => {
                              try {
                                const res = await api.put(`/shared-habits/${id}/note`, { note });
                                setSharedHabits((prev) => prev.map(h => h._id === id ? res.data : h));
                              } catch (err) { console.error(err); }
                            }}
                            onLeave={null} // Disable leave from home home for safety?
                            onDelete={async (id) => {
                              if (!window.confirm("CRITICAL: Delete this entire party group for everyone? This cannot be undone.")) return;
                              try {
                                await api.delete(`/shared-habits/${id}`);
                                setSharedHabits((prev) => prev.filter((h) => h._id !== id));
                              } catch (err) { console.error(err); }
                            }}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <>
                      <HabitList
                        habits={selectedCategory === "All" ? habits : habits.filter(h => h.category === selectedCategory)}
                        onToggle={toggleHabit}
                        updateHabitNote={updateHabitNote}
                        onDelete={deleteHabit}
                        onEdit={editHabit}
                        togglingIds={togglingIds}
                      />
                      {habits.length === 0 && (
                        <p className="text-center text-gray-500 mt-4">
                          No habits yet. Add one to get started!
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {activeTab === "add" && (
              <div className="add-habit-page">
                <h2 className="page-title">+ New Habit</h2>
                <HabitInput
                  onAdd={(data) => {
                    addHabit(data);
                    setActiveTab("home");
                  }}
                  onAddParty={async (data) => {
                    try {
                      await api.post("/shared-habits", {
                        name: data.name,
                        emoji: data.emoji,
                        category: data.category,
                        frequency: data.frequency,
                        invitedUsernames: data.invitees
                      });
                      alert("Party habit created successfully! Invitations sent.");
                      setActiveTab("party");
                    } catch (err) {
                      console.error(err);
                      alert(`Failed: ${err.response?.data?.message || err.message}`);
                    }
                  }}
                />
                <button
                  className="cancel-btn"
                  onClick={() => setActiveTab("home")}
                >
                  Cancel
                </button>
              </div>
            )}

            {activeTab === "goals" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <GoalList habits={habits} />
                <HabitHistoryLog habits={habits} history={history} />
              </div>
            )}
            {activeTab === "leaderboard" && <Leaderboard />}
            {activeTab === "badges" && <BadgeCollection user={user} />}
            {activeTab === "party" && <SharedHabits currentUser={user} />}


            <div className="bottom-nav">
              <button
                className={activeTab === "home" ? "active" : ""}
                onClick={() => changeTab("home")}
              >
                <img src={homeIcon} alt="Home" className="nav-icon" />
              </button>
              <button
                className={activeTab === "goals" ? "active" : ""}
                onClick={() => changeTab("goals")}
              >
                <img src={goalsIcon} alt="Goals" className="nav-icon" />
              </button>

              <button
                className={activeTab === "add" ? "active" : ""}
                onClick={() => changeTab("add")}
              >
                <img src={addIcon} alt="Add" className="nav-icon" />
              </button>

              <button
                className={isChatOpen ? "active" : ""}
                onClick={() => setIsChatOpen(!isChatOpen)}
                style={{ position: 'relative' }}
              >
                <img src={chatIcon} alt="Messages" className="nav-icon" />
                {totalUnread > 0 && (
                  <span className="unread-pulse-badge" style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '12px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: '900',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)',
                    border: '1.5px solid #1a1a2e',
                    animation: 'badgePulse 1.5s infinite'
                  }}>
                    {totalUnread}
                  </span>
                )}
              </button>

              <button
                className={activeTab === "leaderboard" ? "active" : ""}
                onClick={() => changeTab("leaderboard")}
              >
                <img src={rankIcon} alt="Rank" className="nav-icon" />
              </button>

              <button
                className={activeTab === "badges" ? "active" : ""}
                onClick={() => changeTab("badges")}
              >
                <img src={achievementsIcon} alt="Achievements" className="nav-icon" />
              </button>

              <button
                className={activeTab === "party" ? "active" : ""}
                onClick={() => changeTab("party")}
                style={{ position: 'relative' }}
              >
                <img src={partyIcon} alt="Party" className="nav-icon" />
                {invitations.length > 0 && (
                  <span className="unread-pulse-badge" style={{
                    position: 'absolute', top: '-6px', right: '12px', background: '#6366f1', color: 'white',
                    borderRadius: '12px', padding: '2px 6px', fontSize: '9px', fontWeight: '900',
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.7)', border: '1.5px solid #1a1a2e'
                  }}>
                    {invitations.length}
                  </span>
                )}
              </button>

            </div>
          </div>
        </div>
      </div>
      {newBadge && (
        <BadgePopup badge={newBadge} onClose={() => setNewBadge(null)} />
      )}
      <ChatSystem
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={user}
        onUnreadChange={setTotalUnread}
      />
    </>
  );
}
