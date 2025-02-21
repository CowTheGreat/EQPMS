import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../page_styles/ChangePassword.module.css";

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePasswordChanged, user } = useAuth();
  const userId =
    location.state?.id || JSON.parse(localStorage.getItem("user"))?.id;

  const handleChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          new_password: passwords.newPassword,
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
    <div className={styles.changePasswordContainer}>
      <div className={styles.changePasswordBox}>
        <h1 className={styles.title}>Change Password</h1>
        <form onSubmit={handlePasswordChange} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            Change Password
          </button>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
        </form>

        <p className={styles.backToLogin}>
          <a href="/login">Back to Login</a>
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;
