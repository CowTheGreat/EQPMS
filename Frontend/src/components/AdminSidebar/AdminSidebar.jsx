import React from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import styles from "./AdminSidebar.module.css";
import { useAuth } from "../../context/AuthContext";
import {
  FiHome,
  FiUserPlus,
  FiSettings,
  FiClipboard,
  FiLogOut,
} from "react-icons/fi";

const AdminSidebar = ({ onLogout }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Redirect if user is not logged in or not an admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.logo}>Admin Panel</h2>
      <ul className={styles.navList}>
        <li className={location.pathname === "/assign-qp" ? styles.active : ""}>
          <Link to="/assign-qp">
            <FiClipboard className={styles.icon} />
            Assign QP
          </Link>
        </li>

        <li
          className={
            location.pathname === "/admin-dashboard" ? styles.active : ""
          }
        >
          <Link to="/admin-dashboard">
            <FiHome className={styles.icon} />
            Dashboard
          </Link>
        </li>

        <li className={location.pathname === "/access-qp" ? styles.active : ""}>
          <Link to="/access-qp">
            <FiClipboard className={styles.icon} />
            Access QP
          </Link>
        </li>

        <li className={location.pathname === "/add-user" ? styles.active : ""}>
          <Link to="/add-user">
            <FiUserPlus className={styles.icon} />
            Add New User
          </Link>
        </li>

        <li className={location.pathname === "/settings" ? styles.active : ""}>
          <Link to="/settings">
            <FiSettings className={styles.icon} />
            Settings
          </Link>
        </li>
      </ul>

      <button className={styles.logout} onClick={onLogout}>
        <FiLogOut className={styles.icon} />
        Logout
      </button>
    </div>
  );
};

export default AdminSidebar;
