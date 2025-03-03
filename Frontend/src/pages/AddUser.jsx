import React, { useState, useEffect } from "react";
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
  const [users, setUsers] = useState([]); // Stores users for deletion
  const [selectedBoard, setSelectedBoard] = useState("");

  // State for deleting users
  const [selectedUser, setSelectedUser] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");

  // Fetch users when board is selected
  useEffect(() => {
    if (selectedBoard) {
      fetch(`http://localhost:8080/get-faculty?board=${selectedBoard}`)
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(() => setError("Failed to fetch users"));
    }
  }, [selectedBoard]);

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
      password: passwords.newPassword,
      board: formData.board,
      role: formData.role,
    };

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
    } catch {
      setError("Server error. Please try again.");
    }
  };

  const handleDeleteUser = async () => {
    if (confirmDelete !== "confirm") {
      setError("You must type 'confirm' to delete the user.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/delete-user/${selectedUser}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSuccess("User deleted successfully!");
        setUsers(users.filter((user) => user.regno !== selectedUser));
        setSelectedUser("");
        setConfirmDelete("");
      } else {
        const result = await response.json();
        setError(result.detail || "Failed to delete user.");
      }
    } catch {
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
            <label>Employee ID</label>
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

      <hr />

      {/* Delete User Section */}
      <h2>Delete User</h2>
      <div className={styles.deleteSection}>
        <label>Select Board</label>
        <select
          value={selectedBoard}
          onChange={(e) => setSelectedBoard(e.target.value)}
        >
          <option value="">Select Board</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
        </select>

        {users.length > 0 && (
          <>
            <label>Select User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.regno} value={user.regno}>
                  {user.name} ({user.regno})
                </option>
              ))}
            </select>
          </>
        )}

        {selectedUser && (
          <>
            <label>Type 'confirm' to delete</label>
            <input
              type="text"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
            />

            <button onClick={handleDeleteUser} className={styles.deleteButton}>
              Delete User
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AddUser;
