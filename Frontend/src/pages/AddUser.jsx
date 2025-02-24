import React, { useState } from "react";
import styles from "../page_styles/AddUser.module.css";

const AddUser = () => {
  const [formData, setFormData] = useState({
    name: "",
    regno: "",
    mail: "",
    board: "",
    role: "user",
  });

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.name ||
      !formData.regno ||
      !formData.mail ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setError("All fields are required.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const userData = {
      name: formData.name,
      regno: formData.regno,
      mail: formData.mail,
      password: passwords.newPassword, // Send password as "password" not "pwd"
      board: formData.board,
      role: formData.role,
    };

    console.log("Sending data:", userData); // Debugging log

    try {
      const response = await fetch("http://localhost:8080/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess("User added successfully!");
        setFormData({ name: "", regno: "", mail: "", board: "", role: "user" });
        setPasswords({ newPassword: "", confirmPassword: "" });
      } else {
        setError(result.detail || "Something went wrong.");
      }
    } catch (error) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Add New User</h2>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Reg No</label>
            <input
              type="text"
              name="regno"
              value={formData.regno}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>Email</label>
          <input
            type="email"
            name="mail"
            value={formData.mail}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>Board</label>
          <select
            name="board"
            value={formData.board}
            onChange={handleChange}
            required
          >
            <option value="">Select Board</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button type="submit" className={styles.button}>
          Add User
        </button>
      </form>
    </div>
  );
};

export default AddUser;
