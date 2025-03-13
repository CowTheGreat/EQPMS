import React, { useState } from "react";

const UnlockAllPapers = () => {
  const [session, setSession] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (confirmationText.toLowerCase() !== "confirm") {
      setMessage("Please type 'confirm' to proceed.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/unlock-all-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
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
      <h2 className="text-lg font-bold mb-2">Unlock All Papers</h2>

      <input
        type="text"
        placeholder="Enter Session (e.g., 202401)"
        value={session}
        onChange={(e) => setSession(e.target.value)}
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
        disabled={!session || !confirmationText}
      >
        Submit
      </button>

      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
    </div>
  );
};

export default UnlockAllPapers;
