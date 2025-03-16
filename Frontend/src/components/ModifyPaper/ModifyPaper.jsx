import React, { useState } from "react";

const ModifyPaper = () => {
  const [refNo, setRefNo] = useState("");
  const [paperDetails, setPaperDetails] = useState(null);
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

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
    setShowConfirm(false);
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

          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Update Paper
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <p className="mb-4">
              Are you sure you want to update the paper details?
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
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

export default ModifyPaper;
