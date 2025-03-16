import React, { useState, useEffect } from "react";
import styles from "./DeleteUser.module.css";

const DeleteUser = () => {
  const [users, setUsers] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}delete-user/${selectedUser}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSuccess("User deleted successfully!");
        setUsers(users.filter((user) => user.regno !== selectedUser));
        setSelectedUser("");
      } else {
        const result = await response.json();
        setError(result.detail || "Failed to delete user.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Delete User</h2>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

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
          <button
            onClick={() => setShowConfirm(true)}
            className={styles.deleteButton}
          >
            Delete User
          </button>
        )}

        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
            <div className="bg-white p-4 rounded shadow-lg">
              <p className="mb-4">Are you sure you want to delete this user?</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-black rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteUser;
