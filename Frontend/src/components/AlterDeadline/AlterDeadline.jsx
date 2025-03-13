import React, { useState } from "react";

const AlterDeadline = () => {
  const [session, setSession] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (confirmationText.toLowerCase() !== "confirm") {
      setMessage("Please type 'confirm' to proceed.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/update-deadline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, new_deadline: newDeadline }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Success: ${data.message}`);
      } else {
        setMessage(`Error: ${data.detail}`);
      }
    } catch (error) {
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Alter QP Deadline</h2>

      <input
        type="text"
        placeholder="Enter Session (e.g., 202401)"
        value={session}
        onChange={(e) => setSession(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />

      <input
        type="date"
        value={newDeadline}
        onChange={(e) => setNewDeadline(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />

      <input
        type="text"
        placeholder="Type 'confirm' to proceed"
        value={confirmationText}
        onChange={(e) => setConfirmationText(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />

      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        disabled={!session || !newDeadline || !confirmationText}
      >
        Submit
      </button>

      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
    </div>
  );
};

export default AlterDeadline;
