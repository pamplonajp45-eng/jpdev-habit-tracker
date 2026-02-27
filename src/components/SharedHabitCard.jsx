import { useState, useEffect, useRef } from "react";

const avatarColors = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"
];

function getInitials(name) {
  return name ? name.slice(0, 2).toUpperCase() : "??";
}

function getColor(username) {
  let hash = 0;
  for (let c of username) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function SharedHabitCard({ habit, currentUser, onToggle, onLeave, onDelete, onUpdateNote, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editEmoji, setEditEmoji] = useState(habit.emoji || "🤝");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const members = habit.members || [];
  const totalMembers = members.length;
  const completedMembers = members.filter((m) => m.completedToday).length;
  const allDone = completedMembers === totalMembers && totalMembers > 0;
  const myEntry = members.find((m) => m.userId === currentUser._id);

  const [noteText, setNoteText] = useState(myEntry?.note || "");
  const textareaRef = useRef(null);

  // Recalculate height whenever noteText changes (including after save)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [noteText]);

  useEffect(() => {
    if (myEntry?.note !== undefined && noteText === "") {
      setNoteText(myEntry.note);
    }
  }, [myEntry?.note]);

  const iDone = myEntry?.completedToday ?? false;
  const isCreator = habit.createdBy === currentUser._id;

  const progressPct = totalMembers > 0 ? Math.round((completedMembers / totalMembers) * 100) : 0;

  const handleSave = async () => {
    if (!editName.trim()) return alert("Name is required");
    try {
      await onEdit(habit._id, { name: editName, emoji: editEmoji });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save changes");
    }
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      await onUpdateNote(habit._id, noteText);
    } catch (err) {
      alert("Failed to save note");
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div
      className="shared-habit-card"
      style={{
        background: allDone
          ? "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(99,102,241,0.1) 100%)"
          : "rgba(30,30,46,0.7)",
        border: allDone
          ? "1.5px solid rgba(16,185,129,0.5)"
          : "1.5px solid rgba(99,102,241,0.2)",
        borderRadius: "16px",
        padding: "1rem 1.1rem",
        marginBottom: "1rem",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow pulse when all done */}
      {allDone && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.18) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
      )}

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        {/* Emoji / icon */}
        {isEditing ? (
          <input
            value={editEmoji}
            onChange={(e) => setEditEmoji(e.target.value)}
            style={{
              width: 44, height: 44, borderRadius: "12px", border: "1px solid #6366f1",
              background: "rgba(30,30,46,0.8)", color: "#fff", textAlign: "center", fontSize: "1.4rem"
            }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
            background: "rgba(99,102,241,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.4rem"
          }}>
            {habit.emoji || "🤝"}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{
                width: "100%", background: "rgba(30,30,46,0.8)", border: "1px solid #6366f1",
                borderRadius: "8px", padding: "4px 8px", color: "#fff", fontWeight: 700
              }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "1rem" }}>
                {habit.name}
              </span>
              {isCreator && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: "none", border: "none", color: "#6366f1",
                    fontSize: "0.75rem", cursor: "pointer", opacity: 0.7
                  }}
                >
                  ✎ Edit
                </button>
              )}
              {/* Streak badge */}
              {habit.streak > 0 && (
                <span style={{
                  background: "rgba(245,158,11,0.2)", color: "#fbbf24",
                  border: "1px solid rgba(245,158,11,0.35)",
                  borderRadius: "20px", padding: "1px 8px", fontSize: "0.75rem", fontWeight: 700
                }}>
                  🔥 {habit.streak}d streak
                </span>
              )}
            </div>
          )}

          <p style={{ color: "#6b7280", fontSize: "0.78rem", margin: "2px 0 0", display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", color: "#a0a0b8" }}>{habit.frequency || "daily"}</span>
            <span style={{ color: "#4b5563" }}>•</span>
            <span style={{ background: "rgba(99,102,241,0.1)", padding: "2px 6px", borderRadius: "4px", color: "#818cf8" }}>{habit.category || "general"}</span>
            <span style={{ color: "#4b5563" }}>•</span>
            <span>{totalMembers} members</span>
          </p>

          {isEditing && (
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                onClick={handleSave}
                style={{
                  background: "#6366f1", color: "#fff", border: "none",
                  borderRadius: "6px", padding: "4px 12px", fontSize: "0.75rem", cursor: "pointer"
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(habit.name);
                  setEditEmoji(habit.emoji || "🤝");
                }}
                style={{
                  background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
                  borderRadius: "6px", padding: "4px 12px", fontSize: "0.75rem", cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* My toggle button */}
        {!isEditing && (
          <button
            onClick={() => onToggle(habit._id, noteText)}
            style={{
              width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
              border: iDone ? "2px solid #34d399" : "2px solid rgba(99,102,241,0.4)",
              background: iDone ? "rgba(16,185,129,0.2)" : "rgba(30,30,46,0.8)",
              color: iDone ? "#34d399" : "#6b7280",
              fontSize: "1.1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease"
            }}
            title={iDone ? "Mark as not done" : "Mark as done"}
          >
            {iDone ? "✓" : "○"}
          </button>
        )}
      </div>

      {/* Team progress bar */}
      <div style={{ marginTop: "0.85rem", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Team progress</span>
          <span style={{ fontSize: "0.75rem", color: "#a0a0b8", fontWeight: 600 }}>
            {completedMembers}/{totalMembers}
          </span>
        </div>
        <div style={{
          height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden"
        }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${progressPct}%`,
            background: allDone
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "linear-gradient(90deg, #6366f1, #818cf8)",
            transition: "width 0.5s cubic-bezier(0.34,1.56,0.64,1)"
          }} />
        </div>
      </div>

      {/* Header/Summary avatars & dropdown toggle */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: "0.75rem",
          gap: "0.35rem",
          cursor: "pointer",
          padding: "4px 0"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
          {members.slice(0, 5).map((member) => (
            <div
              key={member.userId}
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: getColor(member.username),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.55rem", fontWeight: 800, color: "#fff",
                border: member.completedToday
                  ? "1.5px solid #34d399"
                  : "1.5px solid rgba(255,255,255,0.1)",
                opacity: member.completedToday ? 1 : 0.5,
              }}
            >
              {getInitials(member.username)}
            </div>
          ))}
          {members.length > 5 && (
            <span style={{ fontSize: "0.65rem", color: "#6b7280", marginLeft: "2px" }}>+{members.length - 5}</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: expanded ? "#6366f1" : "#6b7280", transition: "all 0.2s" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700 }}>{expanded ? "COLLAPSE" : "DETAILS"}</span>
          <span style={{
            fontSize: "0.8rem",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            display: "inline-block"
          }}>▼</span>
        </div>
      </div>

      {/* Collapsible Dropdown Content */}
      {expanded && (
        <div style={{
          marginTop: "1rem",
          borderTop: "1.5px solid rgba(255,255,255,0.06)",
          paddingTop: "1.2rem",
          animation: "cardExpand 0.3s ease-out"
        }}>
          <style>{`
            @keyframes cardExpand {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Daily Note Section (Inside Dropdown) */}
          {iDone && (
            <div style={{
              marginBottom: "1.2rem",
              background: "rgba(99,102,241,0.05)",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid rgba(99,102,241,0.15)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Your Daily Note
                </label>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSaveNote(); }}
                  disabled={isSavingNote}
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #818cf8)",
                    color: "#fff", border: "none", borderRadius: "6px",
                    padding: "4px 12px", fontSize: "0.7rem", fontWeight: 700,
                    cursor: "pointer", opacity: isSavingNote ? 0.6 : 1
                  }}
                >
                  {isSavingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
              <textarea
                ref={textareaRef}
                placeholder="What did you do today?..."
                value={noteText}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  setNoteText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onBlur={() => onUpdateNote(habit._id, noteText)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleSaveNote();
                    e.target.blur();
                  }
                }}
                rows={1}
                style={{
                  width: "100%", background: "rgba(30,30,46,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                  padding: "10px 12px", fontSize: "0.85rem", color: "#e2e8f0",
                  outline: "none", resize: "none", boxSizing: "border-box"
                }}
              />
            </div>
          )}

          {/* Team Notes Section (Inside Dropdown) */}
          {members.some(m => m.note && m.note.trim() !== "") && (
            <div style={{
              marginBottom: "1.2rem",
              padding: "0.8rem",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <div style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                Team Notes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {members.filter(m => m.note && m.note.trim() !== "").map((member) => (
                  <div key={member.userId} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: getColor(member.username),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.6rem", fontWeight: 800, color: "#fff", flexShrink: 0,
                      marginTop: "2px"
                    }}>
                      {getInitials(member.username)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a0a0b8" }}>
                        {member.username}
                        {member.userId.toString() === currentUser._id.toString() && (
                          <span style={{ color: "#6366f1", marginLeft: "4px", fontSize: "0.65rem" }}>(You)</span>
                        )}
                      </div>
                      <div style={{
                        fontSize: "0.78rem", color: "#e2e8f0",
                        background: "rgba(255,255,255,0.03)",
                        padding: "6px 10px", borderRadius: "0 10px 10px 10px",
                        marginTop: "2px", borderLeft: `2px solid ${getColor(member.username)}`,
                        whiteSpace: "pre-wrap", wordBreak: "break-word"
                      }}>
                        {member.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Member List (Inside Dropdown) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
              Party Teammates
            </div>
            {members.map((member) => (
              <div key={member.userId} style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.5rem", borderRadius: "10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.02)"
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: getColor(member.username),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 800, color: "#fff",
                  flexShrink: 0
                }}>
                  {getInitials(member.username)}
                </div>
                <span style={{ fontSize: "0.82rem", color: "#e2e8f0", flex: 1 }}>
                  {member.username}
                  {member.userId === currentUser._id && (
                    <span style={{ color: "#6366f1", marginLeft: 4, fontSize: "0.7rem" }}>(you)</span>
                  )}
                </span>
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700,
                  color: member.completedToday ? "#10b981" : "#64748b",
                  background: member.completedToday ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
                  padding: "2px 8px", borderRadius: "12px"
                }}>
                  {member.completedToday ? "Done ✓" : "Pending"}
                </span>
              </div>
            ))}
          </div>

          {/* Actions Section */}
          <div style={{ marginTop: "1.2rem", display: "flex", gap: "0.6rem" }}>
            {isCreator ? (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(habit._id); }}
                style={{
                  flex: 1, background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444", borderRadius: "10px", padding: "10px",
                  fontSize: "0.8rem", cursor: "pointer", fontWeight: 700
                }}
              >
                🗑️ Delete Group
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onLeave && onLeave(habit._id); }}
                style={{
                  flex: 1, background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444", borderRadius: "10px", padding: "10px",
                  fontSize: "0.8rem", cursor: "pointer", fontWeight: 700
                }}
              >
                🚪 Leave Party
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
