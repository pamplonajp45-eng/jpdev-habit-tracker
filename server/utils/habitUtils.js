// Helper: Get previous due date for a habit
exports.getPreviousDueDate = (habit, today) => {
    const prev = new Date(today);

    if (habit.frequencyType === "daily") {
        prev.setDate(prev.getDate() - 1);
        return prev;
    }

    if (habit.frequencyType === "weekly") {
        // Look back day by day until we find a match in frequencyData
        const scheduledDays = new Set(habit.frequencyData);
        for (let i = 1; i <= 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            if (scheduledDays.has(checkDate.getDay())) {
                return checkDate;
            }
        }
        prev.setDate(prev.getDate() - 7);
        return prev;
    }

    if (habit.frequencyType === "custom") {
        const interval = habit.frequencyData[0] || 1;
        prev.setDate(prev.getDate() - interval);
        return prev;
    }

    return prev;
};

// Helper: Check if habit is due today
exports.isHabitDue = (habit, date) => {
    if (habit.frequencyType === "daily") return true;

    if (habit.frequencyType === "weekly") {
        return habit.frequencyData.includes(date.getDay());
    }

    if (habit.frequencyType === "custom") {
        const interval = habit.frequencyData[0] || 1;
        const start = new Date(habit.createdAt);
        const startUTC = Date.UTC(
            start.getFullYear(),
            start.getMonth(),
            start.getDate(),
        );
        const dateUTC = Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
        );
        const diffDays = Math.floor((dateUTC - startUTC) / (1000 * 60 * 60 * 24));
        return diffDays % interval === 0;
    }

    return true;
};
