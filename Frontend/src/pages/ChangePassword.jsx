import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePasswordChanged, user } = useAuth();
  const userId =
    location.state?.id || JSON.parse(localStorage.getItem("user"))?.id;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8080/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password update failed");
      }

      // Update user state in AuthContext
      updatePasswordChanged();

      alert("Password changed successfully! Redirecting...");

      // Redirect based on role
      navigate(user?.role === "admin" ? "/admin-dashboard" : "/user-console");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="change-password-container">
      <h1>Change Your Password</h1>
      <form onSubmit={handlePasswordChange}>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Update Password</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ChangePassword;
