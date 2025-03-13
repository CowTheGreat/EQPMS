import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// import { generateToken } from "../utils/auth";
import styles from "../page_styles/Login.module.css";

const Login = () => {
  const [isUser, setIsUser] = useState(true);
  const [credentials, setCredentials] = useState({ id: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: credentials.id,
            password: credentials.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (Boolean(data.force_password_change)) {
        navigate("/change-password", { state: { id: credentials.id } });
        return;
      }

      localStorage.setItem("token", data.token);
      login(
        {
          id: credentials.id,
          role: data.role,
          passwordChanged: data.password_changed,
        },
        data.token
      );

      navigate(data.role === "admin" ? "/admin-dashboard" : "/user-console");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Welcome Back</h1>

        <div className={styles.tabs}>
          <div
            className={`${styles.tab} ${isUser ? styles.activeTab : ""}`}
            onClick={() => setIsUser(true)}
          >
            User Login
          </div>
          <div
            className={`${styles.tab} ${!isUser ? styles.activeTab : ""}`}
            onClick={() => setIsUser(false)}
          >
            Admin Login
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              {isUser ? "User ID" : "Admin ID"}
            </label>
            <input
              type="text"
              name="id"
              value={credentials.id}
              onChange={handleChange}
              className={styles.input}
              placeholder={isUser ? "Enter user ID" : "Enter admin ID"}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            Login
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
