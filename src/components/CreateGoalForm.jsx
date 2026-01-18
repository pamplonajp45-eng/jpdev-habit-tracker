import React, { useState } from "react";
import api from "../utils/api";

const CreateGoalForm = ({ habits, onGoalCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "streak",
    targetValue: "",
    linkedHabitId: "",
    deadline: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/goals", formData);
      if (onGoalCreated) onGoalCreated(res.data);
      setFormData({
        title: "",
        description: "",
        type: "streak",
        targetValue: "",
        linkedHabitId: "",
        deadline: "",
      });
    } catch (error) {
      console.error("Error creating goal:", error);
      alert("Failed to create goal. Make sure details are valid.");
    }
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    background: "var(--card-bg)",
    padding: "1rem",
    borderRadius: "12px",
    border: "1px solid var(--card-border)",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "0.8rem",
    color: "#888",
    marginBottom: "0.3rem",
    display: "block",
    fontWeight: "500",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
  };

  const selectStyle = {
    ...inputStyle,
    color: "black",
  };

  const rowStyle = {
    display: "flex",
    gap: "0.75rem",
    flexDirection: "row",
    flexWrap: "wrap",
  };

  const fieldWrapperStyle = {
    flex: "1 1 200px",
    minWidth: "0",
    display: "flex",
    flexDirection: "column",
  };

  const buttonRowStyle = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
    flexWrap: "wrap",
  };

  const cancelButtonStyle = {
    flex: "0 1 auto",
    minWidth: "100px",
    background: "#333",
    padding: "0.75rem 1.5rem",
  };

  const submitButtonStyle = {
    flex: "1 1 auto",
    minWidth: "120px",
    padding: "0.75rem 1.5rem",
  };

  return (
    <div className="habit-form" style={formStyle}>
      <h3 className="stats-title" style={{ margin: "0 0 0.5rem 0" }}>
        Create New Goal
      </h3>

      {/* Title Input */}
      <div style={{ width: "100%" }}>
        <label style={labelStyle}>Goal Title</label>
        <input
          type="text"
          name="title"
          placeholder="e.g., 30 Day Yoga Streak"
          value={formData.title}
          onChange={handleChange}
          required
          className="habit-textbox"
          style={inputStyle}
        />
      </div>

      {/* Description Textarea */}
      <div style={{ width: "100%" }}>
        <label style={labelStyle}>Description (Optional)</label>
        <textarea
          name="description"
          placeholder="Add motivation or details..."
          value={formData.description}
          onChange={handleChange}
          className="habit-textbox"
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: "60px",
            maxHeight: "150px",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Goal Type and Target Row */}
      <div style={rowStyle}>
        <div style={fieldWrapperStyle}>
          <label style={labelStyle}>Goal Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="habit-textbox"
            style={selectStyle}
          >
            <option value="streak">Streak (Days in a row)</option>
            <option value="total_count">Total Completion Count</option>
            <option value="deadline_count">Count by Deadline</option>
          </select>
        </div>

        <div style={{ ...fieldWrapperStyle, flex: "0 1 150px" }}>
          <label style={labelStyle}>Target Value</label>
          <input
            type="number"
            name="targetValue"
            placeholder="e.g., 30"
            value={formData.targetValue}
            onChange={handleChange}
            required
            min="1"
            className="habit-textbox"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Habit Link and Deadline Row */}
      <div style={rowStyle}>
        <div style={fieldWrapperStyle}>
          <label style={labelStyle}>Link to Habit</label>
          <select
            name="linkedHabitId"
            value={formData.linkedHabitId}
            onChange={handleChange}
            required
            className="habit-textbox"
            style={selectStyle}
          >
            <option value="">-- Select Habit --</option>
            {habits.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...fieldWrapperStyle, flex: "0 1 180px" }}>
          <label style={labelStyle}>Deadline (Optional)</label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="habit-textbox"
            style={selectStyle}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={buttonRowStyle}>
        <button
          type="button"
          onClick={onCancel}
          className="habit-submit"
          style={cancelButtonStyle}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className="habit-submit"
          style={submitButtonStyle}
        >
          Create Goal
        </button>
      </div>
    </div>
  );
};

export default CreateGoalForm;
