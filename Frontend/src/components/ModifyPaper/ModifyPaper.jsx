import React, { useState } from "react";

const ModifyPaper = () => {
  const [refNo, setRefNo] = useState("");
  const [paperDetails, setPaperDetails] = useState(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [message, setMessage] = useState("");

  const fetchPaperDetails = async () => {
    if (!refNo) {
      setMessage("Please enter a valid Reference Number.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}get-paper-details?refNo=${refNo}`
      );
      const data = await response.json();

      if (response.ok) {
        setPaperDetails(data);
        setMessage("");
      } else {
        setMessage(`Error: ${data.detail}`);
        setPaperDetails(null);
      }
    } catch (error) {
      setMessage("Server error. Please try again.");
    }
  };

  const handleUpdate = async () => {
    if (confirmationText.toLowerCase() !== "confirm") {
      setMessage("Please type 'confirm' to proceed.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}update-paper`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paperDetails),
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
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Modify Paper</h2>

      <input
        type="text"
        placeholder="Enter QP Reference Number"
        value={refNo}
        onChange={(e) => setRefNo(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />

      <button
        onClick={fetchPaperDetails}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
      >
        Fetch Details
      </button>

      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}

      {paperDetails && (
        <div>
          {Object.keys(paperDetails).map((key) => (
            <input
              key={key}
              type="text"
              value={paperDetails[key] || ""}
              onChange={(e) =>
                setPaperDetails({ ...paperDetails, [key]: e.target.value })
              }
              className="border p-2 rounded w-full mb-2"
              placeholder={key}
            />
          ))}

          <input
            type="text"
            placeholder="Type 'confirm' to proceed"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          />

          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            disabled={!confirmationText}
          >
            Update Paper
          </button>
        </div>
      )}
    </div>
  );
};

export default ModifyPaper;
