import React, { useState, useEffect } from "react";
import styles from "./BlacklistManagement.module.css";

const BlacklistManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmUnBlack, setShowConfirmUnBlack] = useState(false);
  const [blacklistedUsers, setBlacklistedUsers] = useState([]);

  useEffect(() => {
    if (selectedBoard) {
      fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }get-faculty-noblack?board=${selectedBoard}`
      )
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(() => setError("Failed to fetch users"));
    }
  }, [selectedBoard]);

  const handleBlacklistUser = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}blacklist-user/${selectedUser}`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        setSuccess("User blacklisted successfully!");
        setUsers(users.filter((user) => user.regno !== selectedUser));
        setSelectedUser("");
      } else {
        const result = await response.json();
        setError(result.detail || "Failed to blacklist user.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setShowConfirm(false);
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}get-blacklisted-faculty`)
      .then((res) => res.json())
      .then((data) => setBlacklistedUsers(data))
      .catch(() => setError("Failed to fetch blacklisted users"));
  }, []);

  const handleUnblacklistUser = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}unblacklist-user/${selectedUser}`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        setSuccess("User unblacklisted successfully!");
        setBlacklistedUsers(
          blacklistedUsers.filter((user) => user.regno !== selectedUser)
        );
        setSelectedUser(null);
      } else {
        const result = await response.json();
        setError(result.detail || "Failed to unblacklist user.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setShowConfirmUnBlack(false);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <h2>Blacklist User</h2>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <div className={styles.blacklistSection}>
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
              className={styles.blacklistButton}
            >
              Blacklist User
            </button>
          )}

          {showConfirm && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
              <div className="bg-white p-4 rounded shadow-lg">
                <p className="mb-4">
                  Are you sure you want to blacklist this user?
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 bg-gray-300 text-black rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBlacklistUser}
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
      <div>
        <h2>Blacklisted Users</h2>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        {blacklistedUsers.length === 0 ? (
          <p>No blacklisted users</p>
        ) : (
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Reg No</th>
                <th>Board</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {blacklistedUsers.map((user) => (
                <tr key={user.regno}>
                  <td>{user.name}</td>
                  <td>{user.regno}</td>
                  <td>{user.board}</td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedUser(user.regno);
                        setShowConfirmUnBlack(true);
                      }}
                      className={styles.unblacklistButton}
                    >
                      Unblacklist
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showConfirmUnBlack && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
            <div className="bg-white p-4 rounded shadow-lg">
              <p className="mb-4">
                Are you sure you want to unblacklist this user?
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfirmUnBlack(false)}
                  className="px-4 py-2 bg-gray-300 text-black rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnblacklistUser}
                  className="px-4 py-2 bg-green-500 text-white rounded"
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

export default BlacklistManagement;
