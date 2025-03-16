import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./AdminSidebar.module.css";
import {
  FiHome,
  FiUserPlus,
  FiSettings,
  FiClipboard,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const AdminSidebar = () => {
  const { logout } = useAuth();

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.logo}>Admin Panel</h2>
      <ul className={styles.navList}>
        <li>
          <NavLink
            to="/admin-dashboard"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <FiHome className={styles.icon} />
            Dashboard
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/assign-qp"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <FiClipboard className={styles.icon} />
            Assign QP
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/access-qp"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <FiClipboard className={styles.icon} />
            Access QP
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/user-management"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <FiUserPlus className={styles.icon} />
            User Management
          </NavLink>
        </li>

        {/* <li>
          <NavLink
            to="/add-subject"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <FiClipboard className={styles.icon} />
            Add Subject
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/delete-subject"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <FiClipboard className={styles.icon} />
            Delete Subject
          </NavLink>
        </li> */}

        <li>
          <NavLink
            to="/edit-database"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            <FiSettings className={styles.icon} />
            Database Manager
          </NavLink>
        </li>
      </ul>

      <button className={styles.logout} onClick={logout}>
        <FiLogOut className={styles.icon} />
        Logout
      </button>
    </div>
  );
};

export default AdminSidebar;
