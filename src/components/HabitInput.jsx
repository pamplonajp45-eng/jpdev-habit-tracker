import { useState, useEffect } from "react";
import api from "../utils/api";

export default function HabitInput({ onAdd, onAddParty }) {
  const [text, setText] = useState("");
  const [frequencyType, setFrequencyType] = useState("daily");
  const [selectedDays, setSelectedDays] = useState([]);
  const [customInterval, setCustomInterval] = useState(1);
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState("personal"); // personal | party
  const [emoji, setEmoji] = useState("🤝");
  const [invitees, setInvitees] = useState([]);
  const [friends, setFriends] = useState([]);
  const [fetchingFriends, setFetchingFriends] = useState(false);

  useEffect(() => {
    if (mode === "party") {
      const fetchFriends = async () => {
        setFetchingFriends(true);
        try {
          const res = await api.get("/friends");
          setFriends(res.data);
        } catch (err) {
          console.error("Failed to fetch friends", err);
        } finally {
          setFetchingFriends(false);
        }
      };
      fetchFriends();
    }
  }, [mode]);

  const EMOJI_OPTIONS = ["🤝", "💪", "🏃", "📚", "🧘", "🎯", "🍎", "💧", "🌙", "☀️", "🎵", "✍️"];

  const weekDays = [
    { label: "S", value: 0, full: "Sun" },
    { label: "M", value: 1, full: "Mon" },
    { label: "T", value: 2, full: "Tue" },
    { label: "W", value: 3, full: "Wed" },
    { label: "T", value: 4, full: "Thu" },
    { label: "F", value: 5, full: "Fri" },
    { label: "S", value: 6, full: "Sat" },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    if (text.trim() === "") return;

    // Validate frequency data
    if (frequencyType === "weekly" && selectedDays.length === 0) {
      alert("Please select at least one day of the week");
      return;
    }

    if (mode === "party") {
      if (invitees.length === 0) {
        alert("Please invite at least one friend to your party!");
        return;
      }
      const partyData = {
        name: text,
        emoji,
        category: category || "general",
        frequency: frequencyType,
        invitees: invitees
      };
      onAddParty(partyData);
    } else {
      const habitData = {
        name: text,
        frequencyType: frequencyType,
        frequencyData:
          frequencyType === "weekly"
            ? selectedDays
            : frequencyType === "custom"
              ? [customInterval]
              : [],
        category: category || "general",
      };
      onAdd(habitData);
    }

    // Reset form
    setText("");
    setFrequencyType("daily");
    setSelectedDays([]);
    setCustomInterval(1);
    setCategory("");
  }

  function toggleDay(dayValue) {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue].sort());
    }
  }

  function handleCategoryChange(e) {
    setCategory(e.target.value);
  }

  function toggleInvitee(username) {
    if (invitees.includes(username)) {
      setInvitees(invitees.filter((u) => u !== username));
    } else {
      setInvitees([...invitees, username]);
    }
  }

  return (
    <div className="habit-form">
      {/* Mode Switcher */}
      <div style={{
        display: "flex",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "4px",
        marginBottom: "1.2rem",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <button
          type="button"
          onClick={() => setMode("personal")}
          style={{
            flex: 1, padding: "8px", borderRadius: "10px", border: "none",
            background: mode === "personal" ? "#6366f1" : "transparent",
            color: mode === "personal" ? "#fff" : "#64748b",
            fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
          }}
        >
          👤 Personal
        </button>
        <button
          type="button"
          onClick={() => setMode("party")}
          style={{
            flex: 1, padding: "8px", borderRadius: "10px", border: "none",
            background: mode === "party" ? "#6366f1" : "transparent",
            color: mode === "party" ? "#fff" : "#64748b",
            fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
          }}
        >
          🤝 Party
        </button>
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={mode === "party" ? "Name your party habit..." : "Set a habit to conquer...!"}
        className="habit-textbox"
      />

      {mode === "party" && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.4rem" }}>
            Pick a Party Emoji
          </label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                style={{
                  width: 34, height: 34, borderRadius: "8px", fontSize: "1.1rem",
                  border: emoji === e ? "2px solid #6366f1" : "1.5px solid rgba(255,255,255,0.1)",
                  background: emoji === e ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                  cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="frequency-selector">
        <label>Frequency:</label>

        <select
          value={frequencyType}
          onChange={(e) => setFrequencyType(e.target.value)}
          className="frequency-dropdown"
        >
          <option value="daily">Every day</option>
          <option value="weekly">Specific days of week</option>
          <option value="custom">Every X days</option>
        </select>

        {frequencyType === "weekly" && (
          <div className="day-picker-new">
            <div className="days-row-new">
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`day-pill ${selectedDays.includes(day.value) ? "selected" : ""}`}
                  title={day.full}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {frequencyType === "custom" && (
          <div className="custom-interval-new">
            <label className="panel-label">Every</label>
            <input
              type="number"
              min="1"
              max="30"
              value={customInterval}
              onChange={(e) => setCustomInterval(parseInt(e.target.value) || 1)}
              className="interval-input-new"
            />
            <label className="panel-label">days</label>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.4rem" }}>
          Category
        </label>
        <select
          value={category}
          onChange={handleCategoryChange}
          className="category-dropdown"
          style={{ width: "100%", margin: 0 }}
        >
          <option value="" disabled>Select a category</option>
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

      {mode === "party" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "#6b7280", display: "block", marginBottom: "0.6rem" }}>
            Invite Teammates (Friends Only)
          </label>
          <div style={{
            maxHeight: "140px",
            overflowY: "auto",
            background: "rgba(20,20,36,0.6)",
            borderRadius: "12px",
            border: "1.5px solid rgba(99,102,241,0.2)",
            padding: "4px"
          }}>
            {fetchingFriends ? (
              <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>Loading friends...</div>
            ) : friends.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>No friends found. Add friends to start a party!</div>
            ) : (
              friends.map(f => (
                <div
                  key={f._id}
                  onClick={() => toggleInvitee(f.username)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
                    borderRadius: "10px", cursor: "pointer",
                    background: invitees.includes(f.username) ? "rgba(99,102,241,0.15)" : "transparent",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 800, color: "#fff"
                  }}>
                    {f.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "#e2e8f0", flex: 1 }}>{f.username}</span>
                  {invitees.includes(f.username) && <span style={{ color: "#6366f1", fontWeight: 900 }}>✓</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button onClick={handleSubmit} className="habit-submit" style={{ marginTop: mode === "party" ? "0" : "0.5rem" }}>
        {mode === "party" ? "🚀 Create Party Habit" : "+ Add Habit"}
      </button>
    </div>
  );
}
