import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../page_styles/Login.module.css";
import AdminSidebar from "../components/AdminSidebar/AdminSidebar";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex" }}>
      <AdminSidebar onLogout={handleLogout} />
      <div style={{ marginLeft: "250px", padding: "20px" }}>
        <h1>Welcome to Admin Dashboard</h1>
      </div>
    </div>
  );
};

export default AdminDashboard;
