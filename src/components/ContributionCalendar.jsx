import React, { useMemo } from "react";

/**
 * ContributionCalendar Component
 * Renders a GitHub-style heatmap of habit completion.
 * @param {Array} history - Array of { date, completed, total } records.
 */
export default function ContributionCalendar({ history }) {
    const today = new Date();

    // Generate current calendar year (Jan 1 to Dec 31) plus padding for Sunday-Saturday alignment
    const calendarData = useMemo(() => {
        const data = [];
        const currentYear = today.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        // Start from startOfYear, aligned to the previous Sunday
        const startDate = new Date(startOfYear);
        while (startDate.getDay() !== 0) {
            startDate.setDate(startDate.getDate() - 1);
        }

        const totalDays = Math.floor((endOfYear - startDate) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = 0; i < totalDays; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateString = d.toDateString();

            const record = history.find(r => r.date === dateString);
            const percentage = record && record.total > 0
                ? (record.completed / record.total) * 100
                : 0;

            let level = 0;
            if (percentage > 0 && percentage <= 25) level = 1;
            else if (percentage > 25 && percentage <= 50) level = 2;
            else if (percentage > 50 && percentage <= 75) level = 3;
            else if (percentage > 75) level = 4;

            data.push({
                date: dateString,
                completed: record ? record.completed : 0,
                total: record ? record.total : 0,
                level,
                fullDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                month: d.getMonth(),
                dayOfWeek: d.getDay()
            });
        }
        return data;
    }, [history]);

    // Group by week for vertical columns (or just render squares)
    // GitHub renders columns as weeks.

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Find where months start to display labels (by column)
    const monthLabels = useMemo(() => {
        const labels = [];
        let lastMonth = -1;
        const currentYear = today.getFullYear();

        // Since it's a grid of 7 rows, each column starts at index i where i % 7 == 0
        for (let i = 0; i < calendarData.length; i += 7) {
            const d = new Date(calendarData[i].date);
            const m = d.getMonth();
            const y = d.getFullYear();

            // Only add label if it's a new month AND it belongs to the current year
            if (m !== lastMonth && y === currentYear) {
                labels.push({ name: monthNames[m], colIndex: i / 7, monthIndex: m });
                lastMonth = m;
            }
        }
        return labels;
    }, [calendarData]);

    return (
        <div className="contribution-container">
            <h3 className="stats-title">Habit Consistency</h3>

            <div className="calendar-layout-wrapper">
                {/* Day labels on the left */}
                <div className="day-labels">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                </div>

                <div className="calendar-main">
                    {/* Month labels on top */}


                    <div className="calendar-scroll">
                        <div className="month-labels">
                            {monthLabels.map((ml, i) => (
                                <span
                                    key={i}
                                    className="month-label"
                                    style={{ gridColumnStart: ml.colIndex + 1 }}
                                >
                                    {ml.name}
                                </span>
                            ))}
                        </div>
                        <div className="calendar-grid">
                            {calendarData.map((day, i) => (
                                <div
                                    key={day.date}
                                    className={`calendar-square level-${day.level}`}
                                    title={`${day.fullDate}: ${day.completed}/${day.total} habits`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="calendar-footer">
                <span>Less</span>
                <div className="calendar-legend">
                    <div className="calendar-square level-0"></div>
                    <div className="calendar-square level-1"></div>
                    <div className="calendar-square level-2"></div>
                    <div className="calendar-square level-3"></div>
                    <div className="calendar-square level-4"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
