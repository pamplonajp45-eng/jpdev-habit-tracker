import { useState, useEffect, useCallback } from "react";
import SharedHabitCard from "./SharedHabitCard";
import CreateSharedHabit from "./CreateSharedHabit";
import api from "../utils/api";

export default function SharedHabits({ currentUser }) {
  const [sharedHabits, setSharedHabits] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchSharedHabits = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [habitsRes, invitesRes] = await Promise.all([
        api.get("/shared-habits"),
        api.get("/shared-habits/invitations")
      ]);
      setSharedHabits(habitsRes.data);
      setInvitations(invitesRes.data);
    } catch (e) {
      setError("Could not load party habits.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedHabits();
    // Poll every 30s to show teammates' real-time progress (Sillently)
    const interval = setInterval(() => fetchSharedHabits(true), 30000);
    return () => clearInterval(interval);
  }, [fetchSharedHabits]);

  const handleCreate = async ({ name, emoji, frequency, category, invitees }) => {
    try {
      await api.post("/shared-habits", {
        name,
        emoji,
        frequency,
        category,
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
      await api.post(`/shared-habits/${habitId}/leave`);
      setSharedHabits((prev) => prev.filter((h) => h._id !== habitId));
    } catch (err) {
      console.error("Failed to leave party habit", err);
    }
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm("Permanently delete this party group? All progress for all members will be lost.")) return;
    try {
      await api.delete(`/shared-habits/${habitId}`);
      setSharedHabits((prev) => prev.filter((h) => h._id !== habitId));
    } catch (err) {
      console.error("Failed to delete party group", err);
      alert("Failed to delete party group");
    }
  };

  const handleUpdateNote = async (habitId, note) => {
    try {
      const res = await api.put(`/shared-habits/${habitId}/note`, { note });
      setSharedHabits((prev) =>
        prev.map((h) => (h._id === habitId ? res.data : h))
      );
    } catch (err) {
      console.error("Failed to update note", err);
    }
  };

  const handleAccept = async (habitId) => {
    try {
      await api.post(`/shared-habits/${habitId}/accept`);
      fetchSharedHabits(true);
    } catch (err) {
      console.error("Failed to accept invitation", err);
      alert("Failed to join party.");
    }
  };

  const handleReject = async (habitId) => {
    if (!window.confirm("Reject this invitation?")) return;
    try {
      await api.post(`/shared-habits/${habitId}/reject`);
      fetchSharedHabits(true);
    } catch (err) {
      console.error("Failed to reject invitation", err);
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

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
          Loading party habits…
        </div>
      ) : (
        <>
          {/* Invitations Section */}
          {invitations.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{
                color: "#6366f1", fontSize: "0.85rem", fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem",
                display: "flex", alignItems: "center", gap: "8px"
              }}>
                📩 Pending Invitations ({invitations.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {invitations.map(invite => (
                  <div key={invite._id} style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1.5px dashed rgba(99,102,241,0.3)",
                    borderRadius: "16px",
                    padding: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    animation: "pulseShadow 2s infinite"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "10px",
                        background: "rgba(99,102,241,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.2rem", flexShrink: 0
                      }}>
                        {invite.emoji || "🤝"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{invite.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                          <span style={{ color: "#6366f1", fontWeight: 600 }}>{invite.frequency || "daily"}</span>
                          <span>•</span>
                          <span>{invite.category || "general"}</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#4b5563", marginTop: "1px" }}>
                          Invited by <b>{invite.members.find(m => m.status === 'accepted')?.username || 'someone'}</b>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleAccept(invite._id)}
                        style={{
                          background: "#6366f1", color: "#fff", border: "none",
                          borderRadius: "8px", padding: "8px 16px", fontWeight: 700,
                          fontSize: "0.8rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)"
                        }}
                      >
                        Join
                      </button>
                      <button
                        onClick={() => handleReject(invite._id)}
                        style={{
                          background: "rgba(255,255,255,0.05)", color: "#fff", border: "none",
                          borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", cursor: "pointer"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Internal animation for pulse */}
              <style>{`
                @keyframes pulseShadow {
                  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.1); }
                  50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
                }
              `}</style>

              <div style={{ height: "1.5px", background: "rgba(255,255,255,0.05)", margin: "2rem 0" }} />
            </div>
          )}

          {error ? (
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
                onDelete={handleDelete}
                onUpdateNote={handleUpdateNote}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
