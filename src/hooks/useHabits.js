import { useState, useEffect } from "react";
import api from "../utils/api";

export function useHabits(user) {
    const [habits, setHabits] = useState([]);
    const [history, setHistory] = useState([]);
    const [togglingIds, setTogglingIds] = useState(new Set());

    const fetchData = async () => {
        if (!user) return;
        try {
            const [habitsRes, heatmapRes] = await Promise.all([
                api.get("/habits"),
                api.get("/heatmap"),
            ]);
            setHabits(habitsRes.data);
            setHistory(heatmapRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const playSound = (type) => {
        const soundMap = {
            add: "add.mp3",
            delete: "delete.mp3",
            toggle: "toggle.mp3",
            celebrate: "celebration.mp3",
        };
        const src = soundMap[type];
        if (!src) return;
        try {
            const audio = new Audio(src);
            audio.volume = 1;
            audio.play().catch(() => { });
        } catch (e) { }
    };

    async function addHabit(habitData) {
        try {
            const res = await api.post("/habits", habitData);
            setHabits((prev) => [{ ...res.data, completedToday: false }, ...prev]);
            playSound("add");
        } catch (err) {
            console.error("Failed to add habit", err);
        }
    }

    async function editHabit(id, newName) {
        try {
            const res = await api.put(`/habits/${id}`, { name: newName });
            setHabits((prev) =>
                prev.map((habit) =>
                    habit._id === id ? { ...habit, name: res.data.name } : habit,
                ),
            );
        } catch (err) {
            console.error("Failed to edit habit", err);
        }
    }

    async function toggleHabit(id) {
        const originalHabits = [...habits];
        const targetHabit = habits.find((h) => h._id === id);
        if (!targetHabit) return;

        setTogglingIds((prev) => new Set(prev).add(id));
        const isNowCompleted = !targetHabit.completedToday;
        const optimisticStreak = isNowCompleted
            ? targetHabit.streak + 1
            : Math.max(0, targetHabit.streak - 1);

        setHabits((prev) =>
            prev.map((h) =>
                h._id === id
                    ? { ...h, completedToday: isNowCompleted, streak: optimisticStreak }
                    : h,
            ),
        );

        if (isNowCompleted) playSound("toggle");

        try {
            const res = await api.post(`/habits/${id}/toggle`);
            const updatedHabit = res.data.habit;
            const serverCompletedStatus = res.data.message === "Habit checked";

            setHabits((prev) =>
                prev.map((h) =>
                    h._id === id
                        ? {
                            ...h,
                            completedToday: serverCompletedStatus,
                            streak: updatedHabit.streak,
                        }
                        : h,
                ),
            );

            const heatmapRes = await api.get("/heatmap");
            setHistory(heatmapRes.data);
        } catch (err) {
            console.error("Failed to toggle habit", err);
            setHabits(originalHabits);
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    async function deleteHabit(id) {
        const originalHabits = [...habits];
        setHabits((prev) => prev.filter((h) => h._id !== id));
        playSound("delete");

        try {
            await api.delete(`/habits/${id}`);
            const heatmapRes = await api.get("/heatmap");
            setHistory(heatmapRes.data);
        } catch (err) {
            console.error("Failed to delete habit", err);
            setHabits(originalHabits);
        }
    }

    return {
        habits,
        history,
        togglingIds,
        addHabit,
        editHabit,
        toggleHabit,
        deleteHabit,
        refreshHabits: fetchData,
        setHabits,
        setHistory
    };
}
