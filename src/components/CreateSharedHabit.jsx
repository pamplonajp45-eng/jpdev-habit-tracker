import { useState, useEffect } from "react";
import api from "../utils/api";

const EMOJI_OPTIONS = ["🤝", "💪", "🏃", "📚", "🧘", "🎯", "🍎", "💧", "🌙", "☀️", "🎵", "✍️"];

export default function CreateSharedHabit({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🤝");
  const [frequency, setFrequency] = useState("daily");
  const [category, setCategory] = useState("general");
  const [invitees, setInvitees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [fetchingFriends, setFetchingFriends] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get("/friends");
        setFriends(res.data);
      } catch (err) {
        console.error("Failed to fetch friends", err);
        setError("Could not load your friends list.");
      } finally {
        setFetchingFriends(false);
      }
    };
    fetchFriends();
  }, []);

  const toggleInvitee = (username) => {
    if (invitees.includes(username)) {
      setInvitees((prev) => prev.filter((u) => u !== username));
    } else {
      setInvitees((prev) => [...prev, username]);
    }
    setError("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Please enter a habit name."); return; }
    if (invitees.length === 0) { setError("Invite at least one teammate!"); return; }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), emoji, frequency, category, invitees });
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "rgba(30,30,46,0.95)",
      border: "1.5px solid rgba(99,102,241,0.3)",
      borderRadius: "20px",
      padding: "1.5rem",
      marginBottom: "1.5rem"
    }}>
      <h3 style={{ color: "#e2e8f0", fontWeight: 800, marginBottom: "1.2rem", fontSize: "1.05rem" }}>
        🤝 Create Party Habit
      </h3>

      {/* Emoji picker */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.4rem" }}>
          Pick an emoji
        </label>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                width: 38, height: 38, borderRadius: "10px", fontSize: "1.2rem",
                border: emoji === e ? "2px solid #6366f1" : "1.5px solid rgba(255,255,255,0.1)",
                background: emoji === e ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                cursor: "pointer"
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency Selector */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.4rem" }}>
          Frequency
        </label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{
            width: "100%", padding: "0.65rem 0.9rem",
            borderRadius: "12px", border: "1.5px solid rgba(99,102,241,0.3)",
            background: "rgba(20,20,36,0.8)", color: "#e2e8f0",
            fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
            cursor: "pointer"
          }}
        >
          <option value="daily">Every day</option>
          <option value="weekly">Specific days of week</option>
          <option value="custom">Every X days</option>
        </select>
      </div>

      {/* Category Dropdown */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.4rem" }}>
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: "100%", padding: "0.65rem 0.9rem",
            borderRadius: "12px", border: "1.5px solid rgba(99,102,241,0.3)",
            background: "rgba(20,20,36,0.8)", color: "#e2e8f0",
            fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
            cursor: "pointer"
          }}
        >
          <option value="general">General</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
          <option value="relationship">Relationship</option>
          <option value="self-care">Self-care</option>
          <option value="hobby">Hobby</option>
          <option value="sports">Sports</option>
          <option value="work">Work</option>
          <option value="study">Study</option>
          <option value="self-improvement">Self-improvement</option>
        </select>
      </div>

      {/* Habit name */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.4rem" }}>
          Habit name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning Run, Read 30 mins…"
          style={{
            width: "100%", padding: "0.65rem 0.9rem",
            borderRadius: "12px", border: "1.5px solid rgba(99,102,241,0.3)",
            background: "rgba(20,20,36,0.8)", color: "#e2e8f0",
            fontSize: "0.9rem", outline: "none", boxSizing: "border-box"
          }}
        />
      </div>

      {/* Invite teammates */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.4rem" }}>
          Invite your friends
        </label>

        {fetchingFriends ? (
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Loading friends...</p>
        ) : friends.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            No friends found. Add friends first to create a party!
          </p>
        ) : (
          <div style={{
            maxHeight: "150px",
            overflowY: "auto",
            padding: "0.5rem",
            background: "rgba(20,20,36,0.6)",
            borderRadius: "12px",
            border: "1.5px solid rgba(99,102,241,0.2)"
          }}>
            {friends.map((f) => {
              const isInvited = invitees.includes(f.username.toLowerCase());
              return (
                <div
                  key={f._id}
                  onClick={() => toggleInvitee(f.username)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: isInvited ? "rgba(99,102,241,0.15)" : "transparent",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: isInvited ? "#6366f1" : "rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 800, color: "#fff"
                  }}>
                    {f.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{
                    flex: 1,
                    fontSize: "0.85rem",
                    color: isInvited ? "#a5b4fc" : "#e2e8f0",
                    fontWeight: isInvited ? 700 : 400
                  }}>
                    {f.username}
                  </span>
                  {isInvited && <span style={{ color: "#6366f1", fontWeight: 900 }}>✓</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected count */}
        {invitees.length > 0 && (
          <div style={{ marginTop: "0.6rem", fontSize: "0.75rem", color: "#a5b4fc" }}>
            Selected: {invitees.length} friend{invitees.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{error}</p>
      )}

      {/* Info blurb */}
      <div style={{
        background: "rgba(99,102,241,0.08)", borderRadius: "10px",
        padding: "0.6rem 0.85rem", marginBottom: "1rem",
        fontSize: "0.78rem", color: "#6b7280", lineHeight: 1.5
      }}>
        💡 <strong style={{ color: "#a5b4fc" }}>Party Habit rules:</strong> Everyone in the party must mark the habit complete before midnight for the team streak to count. One person missing = streak broken for everyone!
      </div>

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1, padding: "0.75rem",
            borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", color: "#fff", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Creating…" : "Create Party 🚀"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "0.75rem 1rem", borderRadius: "12px",
            background: "rgba(255,255,255,0.05)",
            border: "1.5px solid rgba(255,255,255,0.1)",
            color: "#6b7280", cursor: "pointer", fontSize: "0.9rem"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
