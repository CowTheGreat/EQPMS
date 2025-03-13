import React, { useState } from "react";

const BroadcastButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
  };

  return (
    <div>
      <button
        onClick={handleBroadcast}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Sending..." : "Send Broadcast Emails"}
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
};

export default BroadcastButton;
