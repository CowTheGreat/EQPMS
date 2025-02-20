import React from "react";
import { useAuth } from "../context/AuthContext";

const SessionAlert = () => {
  const { sessionMessage } = useAuth();

  if (!sessionMessage) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: "#ef4444",
        color: "white",
        padding: "1rem",
        borderRadius: "0.5rem",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <p style={{ margin: 0 }}>{sessionMessage}</p>
    </div>
  );
};

export default SessionAlert;
