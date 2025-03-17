import React, { useState } from "react";
import { FiSend, FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

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
        { method: "POST" }
      );
      const data = await response.json();
      setMessage({ text: data.message, type: "success" });
    } catch (error) {
      setMessage({ text: "Failed to send emails.", type: "error" });
    }

    setLoading(false);
    setShowModal(false);
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      {/* Broadcast Button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "linear-gradient(to bottom right, #667EEA, #4C51BF)",
          color: "white",
          padding: "0.6rem 1.2rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          borderRadius: "0.5rem",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? (
          <>
            <svg
              style={{
                animation: "spin 1s linear infinite",
                width: "1rem",
                height: "1rem",
                color: "white",
              }}
              viewBox="0 0 24 24"
            >
              <circle
                style={{ opacity: 0.25 }}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                style={{ opacity: 0.75 }}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <FiSend style={{ width: "1rem", height: "1rem", opacity: 0.9 }} />
            <span>Broadcast Emails</span>
          </>
        )}
      </button>

      {/* Success/Error Message */}
      {message && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            backgroundColor: message.type === "success" ? "#DCFCE7" : "#FEE2E2",
            color: message.type === "success" ? "#166534" : "#991B1B",
            zIndex: 1001,
          }}
        >
          {message.type === "success" ? (
            <FiCheckCircle style={{ width: "1rem", height: "1rem" }} />
          ) : (
            <FiAlertCircle style={{ width: "1rem", height: "1rem" }} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
              maxWidth: "22rem",
              width: "100%",
              margin: "0 1rem",
              border: "2px solid #667EEA",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#4C51BF",
                marginBottom: "0.5rem",
              }}
            >
              Confirm Broadcast
            </h3>
            <p
              style={{
                color: "#4B5563",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              This will send emails to all registered users. Please confirm.
            </p>

            <div
              style={{ display: "flex", justifyContent: "center", gap: "1rem" }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#F3F4F6",
                  color: "#374151",
                  borderRadius: "0.4rem",
                  transition: "background-color 0.2s ease",
                  cursor: "pointer",
                }}
              >
                <FiX style={{ width: "1rem", height: "1rem" }} />
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#667EEA",
                  color: "white",
                  borderRadius: "0.4rem",
                  transition: "background-color 0.2s ease",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <FiSend style={{ width: "1rem", height: "1rem" }} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BroadcastButton;
