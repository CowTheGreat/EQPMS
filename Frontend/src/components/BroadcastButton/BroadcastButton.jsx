import React, { useState } from "react";

const BroadcastButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleBroadcast = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}broadcast`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage("Failed to send emails.");
    }

    setLoading(false);
    setShowModal(false); // Close the modal after sending
  };

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Sending..." : "Send Broadcast Emails"}
      </button>

      {message && <p className="mt-2">{message}</p>}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <p className="mb-4">
              Are you sure you want to send broadcast emails?
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastButton;
