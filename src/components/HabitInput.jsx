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
    <form onSubmit={handleSubmit} className="mb-6">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Set a habit to conquer"
        className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600"
      >
        + Add
      </button>
    </form>
  );
}