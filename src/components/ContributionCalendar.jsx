import React, { useMemo } from "react";

/**
 * ContributionCalendar Component
 * Renders a GitHub-style heatmap of habit completion.
 * @param {Array} history - Array of { date, completed, total } records.
 */
export default function ContributionCalendar({ history }) {
    const today = new Date();
    const [selectedYear, setSelectedYear] = React.useState(today.getFullYear());

    // Extract available years from history
    const availableYears = useMemo(() => {
        const years = new Set();
        years.add(today.getFullYear());
        if (history) {
            history.forEach(record => {
                const year = new Date(record.date).getFullYear();
                if (!isNaN(year)) years.add(year);
            });
        }
        return Array.from(years).sort((a, b) => b - a);
    }, [history]);

    // Generate calendar year (Jan 1 to Dec 31) plus padding for Sunday-Saturday alignment
    const calendarData = useMemo(() => {
        const data = [];
        const startOfYear = new Date(selectedYear, 0, 1);
        const endOfYear = new Date(selectedYear, 11, 31);

        // Start from startOfYear, aligned to the previous Sunday
        const startDate = new Date(startOfYear);
        while (startDate.getDay() !== 0) {
            startDate.setDate(startDate.getDate() - 1);
        }

        const totalDays = Math.floor((endOfYear - startDate) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = 0; i < totalDays; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);

            // Format d to YYYY-MM-DD using local time
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            const dateString = localDate.toISOString().split('T')[0];

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
                dayOfWeek: d.getDay(),
                year: d.getFullYear()
            });
        }
        return data;
    }, [history, selectedYear]);

    // Group by week for vertical columns (or just render squares)
    // GitHub renders columns as weeks.

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Find where months start to display labels (by column)
    const monthLabels = useMemo(() => {
        const labels = [];
        let lastMonth = -1;

        // Since it's a grid of 7 rows, each column starts at index i where i % 7 == 0
        for (let i = 0; i < calendarData.length; i += 7) {
            const d = new Date(calendarData[i].date);
            const m = d.getMonth();
            const y = d.getFullYear();

            // Only add label if it's a new month AND it belongs to the selected year
            if (m !== lastMonth && y === selectedYear) {
                labels.push({ name: monthNames[m], colIndex: i / 7, monthIndex: m });
                lastMonth = m;
            }
        }
        return labels;
    }, [calendarData, selectedYear]);

    return (
        <div className="contribution-container">
            <div className="calendar-header">
                <h3 className="stats-title">Habit Consistency</h3>
                <select
                    className="year-dropdown"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

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
