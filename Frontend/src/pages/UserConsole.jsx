import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../page_styles/Login.module.css";

const UserConsole = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>User Console</h1>
      <p>Welcome to the user console, {user.id}!</p>
      <button
        onClick={handleLogout}
        className={styles.button}
        style={{ marginTop: "20px" }}
      >
        Logout
      </button>
    </div>
  );
};

export default UserConsole;
