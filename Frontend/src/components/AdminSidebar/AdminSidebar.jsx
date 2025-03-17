import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styles from "./AdminSidebar.module.css";
import {
  FiHome,
  FiUserPlus,
  FiSettings,
  FiClipboard,
  FiLogOut,
  FiMenu,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../assets/svce-logo.png";

const AdminSidebar = () => {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button className={styles.hamburger} onClick={toggleSidebar}>
        <FiMenu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
        {/* Backdrop */}
        {isSidebarOpen && (
          <div className={styles.backdrop} onClick={toggleSidebar} />
        )}

        <div className={styles.logoContainer}>
          <img src={logoImage} alt="Logo" className={styles.logoImage} />
          <h2 className={styles.logoText}>Admin Panel</h2>
        </div>

        <ul className={styles.navList}>
          <li>
            <NavLink
              to="/admin-dashboard"
              className={({ isActive }) => 
                [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')
              }
            >
              <FiHome className={styles.icon} />
              <span className={styles.linkText}>Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/assign-qp"
              className={({ isActive }) => 
                [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')
              }
            >
              <FiClipboard className={styles.icon} />
              <span className={styles.linkText}>Assign QP</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/access-qp"
              className={({ isActive }) => 
                [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')
              }
            >
              <FiClipboard className={styles.icon} />
              <span className={styles.linkText}>Access QP</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/user-management"
              className={({ isActive }) => 
                [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')
              }
            >
              <FiUserPlus className={styles.icon} />
              <span className={styles.linkText}>User Management</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/edit-database"
              className={({ isActive }) => 
                [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')
              }
            >
              <FiSettings className={styles.icon} />
              <span className={styles.linkText}>Database Manager</span>
            </NavLink>
          </li>
        </ul>

        <button className={styles.logout} onClick={logout}>
          <FiLogOut className={styles.icon} />
          <span className={styles.linkText}>Logout</span>
        </button>
      </div>
    </>
  );
};

export default AdminSidebar;