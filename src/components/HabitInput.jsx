import { useState } from "react";

export default function HabitInput({ onAdd }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (text.trim() === "") return;
    onAdd(text);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="habit-form">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Set a habit to conquer...!"
        className="habit-textbox"
      />
      <button
        type="submit"
        className="habit-submit"
      >
        + Add
      </button>
    </form>
  );
}