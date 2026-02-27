import { useState, useEffect, useCallback } from "react";
import SharedHabitCard from "./SharedHabitCard";
import CreateSharedHabit from "./CreateSharedHabit";
import api from "../utils/api";

export default function SharedHabits({ currentUser }) {
  const [sharedHabits, setSharedHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchSharedHabits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/shared-habits");
      setSharedHabits(res.data);
    } catch (e) {
      setError("Could not load party habits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedHabits();
    // Poll every 30s to show teammates' real-time progress
    const interval = setInterval(fetchSharedHabits, 30000);
    return () => clearInterval(interval);
  }, [fetchSharedHabits]);

  const handleCreate = async ({ name, emoji, invitees }) => {
    try {
      const res = await api.post("/shared-habits", {
        name,
        emoji,
        invitedUsernames: invitees,
      });
      setCreating(false);
      fetchSharedHabits();
    } catch (e) {
      throw new Error(e.response?.data?.message || "Failed to create");
    }
  };

  const handleToggle = async (habitId, note) => {
    // Optimistic update
    setSharedHabits((prev) =>
      prev.map((h) => {
        if (h._id !== habitId) return h;
        return {
          ...h,
          members: h.members.map((m) =>
            m.userId === currentUser._id
              ? { ...m, completedToday: !m.completedToday }
              : m
          ),
        };
      })
    );

    try {
      const res = await api.post(`/shared-habits/${habitId}/toggle`, { note });
      const updated = res.data;
      setSharedHabits((prev) =>
        prev.map((h) => (h._id === habitId ? updated : h))
      );
    } catch {
      fetchSharedHabits();
    }
  };

  const handleLeave = async (habitId) => {
    if (!window.confirm("Leave this party habit? Your streak progress will be lost.")) return;
    try {
      const res = await api.post(`/shared-habits/${habitId}/leave`);
      setSharedHabits((prev) => prev.filter((h) => h._id !== habitId));
    } catch (err) {
      console.error("Failed to leave party habit", err);
    }
  };

  const activeParties = sharedHabits.filter((h) => {
    const me = h.members?.find((m) => m.userId === currentUser._id);
    return me;
  });

  const allDoneCount = activeParties.filter(
    (h) => h.members?.every((m) => m.completedToday)
  ).length;

  return (
    <div style={{ paddingBottom: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>
              🤝 Party Habits
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: "2px 0 0" }}>
              Team up · Complete together · Streak together
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", color: "#fff",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
            }}
          >
            + New Party
          </button>
        </div>

        {/* Summary pills */}
        {activeParties.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
            <span style={{
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "20px", padding: "3px 10px", fontSize: "0.78rem", color: "#a5b4fc"
            }}>
              👥 {activeParties.length} {activeParties.length === 1 ? "party" : "parties"}
            </span>
            {allDoneCount > 0 && (
              <span style={{
                background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: "20px", padding: "3px 10px", fontSize: "0.78rem", color: "#34d399"
              }}>
                ✓ {allDoneCount} team{allDoneCount > 1 ? "s" : ""} fully done today!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <CreateSharedHabit
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {/* Habit list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
          Loading party habits…
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "#ef4444", padding: "1rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      ) : activeParties.length === 0 && !creating ? (
        <div style={{
          textAlign: "center", padding: "2.5rem 1rem",
          background: "rgba(30,30,46,0.5)", borderRadius: "16px",
          border: "1.5px dashed rgba(99,102,241,0.2)"
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🤝</div>
          <p style={{ color: "#a0a0b8", fontWeight: 600, margin: 0 }}>No party habits yet!</p>
          <p style={{ color: "#6b7280", fontSize: "0.82rem", marginTop: "0.4rem" }}>
            Create one and invite your friends to build habits together.
          </p>
          <button
            onClick={() => setCreating(true)}
            style={{
              marginTop: "1rem", padding: "0.6rem 1.4rem",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", color: "#fff",
              fontWeight: 700, fontSize: "0.9rem", cursor: "pointer"
            }}
          >
            Create your first party
          </button>
        </div>
      ) : (
        activeParties.map((habit) => (
          <SharedHabitCard
            key={habit._id}
            habit={habit}
            currentUser={currentUser}
            onToggle={handleToggle}
            onLeave={handleLeave}
          />
        ))
      )}
    </div>
  );
}
