import React, { useState } from "react";

const UnlockAllPapers = () => {
  const [session, setSession] = useState("");
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}unlock-all-papers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessage(`Success: ${data.message}`);
      } else {
        setMessage(`Error: ${data.detail}`);
      }
    } catch (error) {
      setMessage("Server error. Please try again.");
    }
    setShowConfirm(false);
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Unlock All Papers</h2>

      <select
        value={session}
        onChange={(e) => setSession(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      >
        <option value="">Select Session</option>
        <option value="MAY">MAY</option>
        <option value="DEC">DEC</option>
      </select>

      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        disabled={!session}
      >
        Submit
      </button>

      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <p className="mb-4">
              Are you sure you want to unlock all papers for this session?
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnlockAllPapers;
