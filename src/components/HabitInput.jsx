import { useState } from "react";

export default function HabitInput({ onAdd }) {
  const [text, setText] = useState("");
  const [frequencyType, setFrequencyType] = useState("daily");
  const [selectedDays, setSelectedDays] = useState([]);
  const [customInterval, setCustomInterval] = useState(1);

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

    const habitData = {
      name: text,
      frequencyType: frequencyType,
      frequencyData:
        frequencyType === "weekly"
          ? selectedDays
          : frequencyType === "custom"
            ? [customInterval]
            : [],
    };

    onAdd(habitData);

    // Reset form
    setText("");
    setFrequencyType("daily");
    setSelectedDays([]);
    setCustomInterval(1);
  }

  function toggleDay(dayValue) {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue].sort());
    }
  }

  return (
    <div className="habit-form">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Set a habit to conquer...!"
        className="habit-textbox"
      />

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
          <div className="day-selector">
            {weekDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`day-button ${selectedDays.includes(day.value) ? "selected" : ""}`}
                title={day.full}
              >
                {day.label}
              </button>
            ))}
          </div>
        )}

        {frequencyType === "custom" && (
          <div className="custom-interval">
            <label>Every</label>
            <input
              type="number"
              min="1"
              max="30"
              value={customInterval}
              onChange={(e) => setCustomInterval(parseInt(e.target.value) || 1)}
              className="interval-input"
            />
            <label>days</label>
          </div>
        )}
      </div>

      <button onClick={handleSubmit} className="habit-submit">
        + Add
      </button>
    </div>
  );
}
