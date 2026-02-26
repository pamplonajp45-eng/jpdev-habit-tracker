import { useState } from "react";

const EMOJI_OPTIONS = ["🤝", "💪", "🏃", "📚", "🧘", "🎯", "🍎", "💧", "🌙", "☀️", "🎵", "✍️"];

export default function CreateSharedHabit({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🤝");
  const [inviteInput, setInviteInput] = useState("");
  const [invitees, setInvitees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addInvitee = () => {
    const trimmed = inviteInput.trim().toLowerCase();
    if (!trimmed) return;
    if (invitees.includes(trimmed)) {
      setError("Already added that user.");
      return;
    }
    setInvitees((prev) => [...prev, trimmed]);
    setInviteInput("");
    setError("");
  };

  const removeInvitee = (username) => {
    setInvitees((prev) => prev.filter((u) => u !== username));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Please enter a habit name."); return; }
    if (invitees.length === 0) { setError("Invite at least one teammate!"); return; }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), emoji, invitees });
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
          Invite by username
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addInvitee()}
            placeholder="Enter username…"
            style={{
              flex: 1, padding: "0.65rem 0.9rem",
              borderRadius: "12px", border: "1.5px solid rgba(99,102,241,0.3)",
              background: "rgba(20,20,36,0.8)", color: "#e2e8f0",
              fontSize: "0.9rem", outline: "none"
            }}
          />
          <button
            onClick={addInvitee}
            style={{
              padding: "0 1rem", borderRadius: "12px",
              background: "rgba(99,102,241,0.25)",
              border: "1.5px solid rgba(99,102,241,0.4)",
              color: "#a5b4fc", fontWeight: 700, cursor: "pointer",
              fontSize: "1.1rem"
            }}
          >
            +
          </button>
        </div>

        {/* Invitee chips */}
        {invitees.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
            {invitees.map((u) => (
              <span
                key={u}
                style={{
                  background: "rgba(99,102,241,0.2)",
                  border: "1px solid rgba(99,102,241,0.35)",
                  borderRadius: "20px", padding: "3px 10px",
                  fontSize: "0.8rem", color: "#a5b4fc",
                  display: "flex", alignItems: "center", gap: "5px"
                }}
              >
                @{u}
                <span
                  onClick={() => removeInvitee(u)}
                  style={{ cursor: "pointer", color: "#ef4444", fontWeight: 700 }}
                >
                  ×
                </span>
              </span>
            ))}
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
