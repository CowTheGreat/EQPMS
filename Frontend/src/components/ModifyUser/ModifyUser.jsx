// Frontend Component (ModifyUser.jsx)
import React, { useState, useEffect } from "react";
import styles from "./ModifyUser.module.css";

const ModifyUser = () => {
  const [users, setUsers] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    mail: "",
    board: "",
    role: "user",
    employeeType: "Internal",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch users when board is selected
  useEffect(() => {
    if (selectedBoard) {
      fetch(
        `${import.meta.env.VITE_API_BASE_URL}get-faculty?board=${selectedBoard}`
      )
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(() => setError("Failed to fetch users"));
    }
  }, [selectedBoard]);

  // Populate form when user is selected
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name,
        mail: selectedUser.mail,
        board: selectedUser.board,
        role: selectedUser.role,
        employeeType: selectedUser.employee_type,
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [selectedUser]);

  const handleSubmit = async () => {
    setShowConfirm(false);
    setError("");
    setSuccess("");

    // Validate passwords if they're being changed
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    const updateData = {
      ...(formData.name !== selectedUser.name && { name: formData.name }),
      ...(formData.mail !== selectedUser.mail && { mail: formData.mail }),
      ...(formData.board !== selectedUser.board && { board: formData.board }),
      ...(formData.role !== selectedUser.role && { role: formData.role }),
      ...(formData.employeeType !== selectedUser.employee_type && {
        employee_type: formData.employeeType,
      }),
      ...(formData.newPassword && { password: formData.newPassword }),
    };

    if (Object.keys(updateData).length === 0) {
      setError("No changes detected");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}update-user/${selectedUser.regno}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSuccess("User updated successfully!");
        setSelectedUser(null);
        setUsers(
          users.map((user) =>
            user.regno === selectedUser.regno
              ? { ...user, ...updateData }
              : user
          )
        );
      } else {
        setError(result.detail || "Update failed");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Modify User</h2>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <div className={styles.selectionSection}>
        <div className={styles.inputGroup}>
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
        </div>

        {users.length > 0 && (
          <div className={styles.inputGroup}>
            <label>Select User</label>
            <select
              value={selectedUser?.regno || ""}
              onChange={(e) =>
                setSelectedUser(users.find((u) => u.regno === e.target.value))
              }
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.regno} value={user.regno}>
                  {user.name} ({user.regno})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                value={formData.mail}
                onChange={(e) =>
                  setFormData({ ...formData, mail: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Board</label>
              <select
                value={formData.board}
                onChange={(e) =>
                  setFormData({ ...formData, board: e.target.value })
                }
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Employee Type</label>
              <select
                value={formData.employeeType}
                onChange={(e) =>
                  setFormData({ ...formData, employeeType: e.target.value })
                }
              >
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>New Password</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                placeholder="Leave blank to keep current"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className={styles.button}
          >
            Update User
          </button>
        </div>
      )}

      {showConfirm && (
        <div className={styles.confirmModal}>
          <div className={styles.modalContent}>
            <p>Are you sure you want to update this user?</p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowConfirm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button onClick={handleSubmit} className={styles.confirmButton}>
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModifyUser;
