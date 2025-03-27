import React, { useState, useEffect } from "react";
import axios from "axios";

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}api/backups`
      );

      const sortedBackups = response.data.sort((a, b) => {
        const timestampA = a.split("_backup")[0];
        const timestampB = b.split("_backup")[0];
        return (
          new Date(timestampB.replace(/-/g, "/")) -
          new Date(timestampA.replace(/-/g, "/"))
        );
      });

      setBackups(sortedBackups);
    } catch (err) {
      setError("Failed to fetch backups. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}api/backups/create`
      );
      setSuccess("Backup created successfully!");
      fetchBackups();
    } catch (err) {
      setError("Failed to create backup. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backupName) => {
    if (!window.confirm("Are you sure you want to delete this backup?")) return;

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}api/backups/delete/${backupName}`
      );
      setSuccess("Backup deleted successfully!");
      fetchBackups();
    } catch (err) {
      setError("Failed to delete backup. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.heading}>Database Backup Manager</h1>

        <div style={styles.controls}>
          <button
            onClick={createBackup}
            disabled={loading}
            style={styles.createButton}
          >
            {loading ? "Processing..." : "➕ Create New Backup"}
          </button>

          <button
            onClick={fetchBackups}
            disabled={loading}
            style={styles.refreshButton}
          >
            🔄 Refresh List
          </button>
        </div>

        {error && <div style={styles.errorMessage}>⚠️ {error}</div>}
        {success && <div style={styles.successMessage}>✅ {success}</div>}

        <div style={styles.backupListContainer}>
          <h2 style={styles.subHeading}>Available Backups</h2>
          {backups.length === 0 ? (
            <div style={styles.emptyState}>No backups available</div>
          ) : (
            <div style={styles.backupList}>
              {backups.map((backup, index) => (
                <div key={index} style={styles.backupItem}>
                  <a
                    href={`${
                      import.meta.env.VITE_API_BASE_URL
                    }api/backups/download/${backup}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.backupLink}
                  >
                    {backup}
                  </a>
                  <div style={styles.actions}>
                    <button
                      onClick={() => deleteBackup(backup)}
                      disabled={loading}
                      style={styles.deleteButton}
                      title="Delete backup"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "#f5f7fa",
    padding: "2rem",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  content: {
    width: "100%",
    maxWidth: "1200px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    padding: "2rem",
  },
  heading: {
    textAlign: "center",
    color: "#2d3748",
    fontSize: "2rem",
    marginBottom: "2rem",
    fontWeight: "600",
  },
  subHeading: {
    color: "#4a5568",
    fontSize: "1.5rem",
    marginBottom: "1.5rem",
    fontWeight: "500",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "0.5rem",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  createButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#4299e1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.2s ease",
    minWidth: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  refreshButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#edf2f7",
    color: "#4a5568",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.2s ease",
    minWidth: "150px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  errorMessage: {
    backgroundColor: "#fff5f5",
    color: "#e53e3e",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1.5rem",
    borderLeft: "4px solid #e53e3e",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  successMessage: {
    backgroundColor: "#f0fff4",
    color: "#38a169",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1.5rem",
    borderLeft: "4px solid #38a169",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  backupListContainer: {
    marginTop: "2rem",
  },
  backupList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
    gap: "1rem",
  },
  backupItem: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  backupLink: {
    color: "#3182ce",
    textDecoration: "none",
    fontWeight: "500",
    flex: "1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginRight: "1rem",
    ":hover": {
      textDecoration: "underline",
    },
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
  },
  deleteButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#fff5f5",
    color: "#e53e3e",
    border: "1px solid #fed7d7",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "600",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    ":hover": {
      backgroundColor: "#e53e3e",
      color: "white",
    },
  },
  emptyState: {
    textAlign: "center",
    color: "#718096",
    padding: "2rem",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px dashed #cbd5e0",
  },
};

export default BackupManager;
