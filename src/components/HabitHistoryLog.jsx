import React from "react";

export default function HabitHistoryLog({ habits, history }) {
    // Get yesterday's date string in YYYY-MM-DD
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const offset = yesterday.getTimezoneOffset();
    const localYesterday = new Date(yesterday.getTime() - (offset * 60 * 1000));
    const yesterdayStr = localYesterday.toISOString().split('T')[0];

    // Check if we have any data for yesterday
    const yesterdayData = history.find(h => h.date === yesterdayStr);

    return (
        <div className="history-log-container" style={{
            background: "rgba(30, 30, 46, 0.6)",
            borderRadius: "20px",
            padding: "1.25rem",
            marginTop: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.05)"
        }}>
            <h3 style={{ color: "#e2e8f0", fontSize: "1rem", marginBottom: "1rem", fontWeight: 700 }}>
                🗓️ Yesterday's Progress
            </h3>

            {!yesterdayData || yesterdayData.completed === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "0.85rem", fontStyle: "italic" }}>
                    No completions recorded for yesterday.
                </p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {/* Note: To get the actual notes for yesterday, we'd need a more detailed history API.
                        For now, I'll update the Heatmap API to include a 'notes' array for each day.
                    */}
                    {yesterdayData.notes && yesterdayData.notes.length > 0 ? (
                        yesterdayData.notes.map((n, i) => (
                            <div key={i} style={{
                                background: "rgba(255, 255, 255, 0.03)",
                                padding: "10px 14px",
                                borderRadius: "12px",
                                borderLeft: "3px solid #6366f1"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#e2e8f0" }}>
                                    {n.habitName}
                                </div>
                                {n.note && (
                                    <div style={{ fontSize: "0.78rem", color: "#a0a0b8", marginTop: "4px" }}>
                                        {n.note}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                            Completed {yesterdayData.completed} {yesterdayData.completed === 1 ? "habit" : "habits"}.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
