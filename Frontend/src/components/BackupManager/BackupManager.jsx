import React, { useState, useEffect } from "react";
import axios from "axios";

const BackupManager = () => {
    const [backups, setBackups] = useState([]); // State to store the list of backups
    const [loading, setLoading] = useState(false); // State to handle loading state
    const [error, setError] = useState(""); // State to handle errors

    // Fetch backups when the component mounts
    useEffect(() => {
        fetchBackups();
    }, []);

    // Function to fetch the list of backups
    const fetchBackups = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get("http://localhost:8000/api/backups");

            // Sort backups by timestamp in descending order (newest first)
            const sortedBackups = response.data.sort((a, b) => {
                const timestampA = a.split("_backup")[0];
                const timestampB = b.split("_backup")[0];
                return new Date(timestampB.replace(/-/g, '/')) - new Date(timestampA.replace(/-/g, '/'));
            });

            setBackups(sortedBackups);
        } catch (err) {
            setError("Failed to fetch backups. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Function to create a new backup
    const createBackup = async () => {
        setLoading(true);
        setError("");
        try {
            await axios.post("http://localhost:8000/api/backups/create");
            fetchBackups(); // Refresh the list after creating a backup
        } catch (err) {
            setError("Failed to create backup. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Function to delete a backup
    const deleteBackup = async (backupName) => {
        setLoading(true);
        setError("");
        try {
            await axios.delete(`http://localhost:8000/api/backups/delete/${backupName}`);
            fetchBackups(); // Refresh the list after deleting a backup
        } catch (err) {
            setError("Failed to delete backup. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Backup Manager</h1>

            {/* Create Backup Button */}
            <button onClick={createBackup} disabled={loading} style={styles.button}>
                {loading ? "Creating Backup..." : "Create Backup"}
            </button>

            {/* Error Message */}
            {error && <p style={styles.error}>{error}</p>}

            {/* List of Backups */}
            <ul style={styles.list}>
                {backups.map((backup, index) => (
                    <li key={index} style={styles.listItem}>
                        {/* Backup Name with Download Link */}
                        <a
                            href={`http://localhost:8000/api/backups/download/${backup}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.link}
                        >
                            {backup}
                        </a>

                        {/* Delete Button */}
                        <button
                            onClick={() => deleteBackup(backup)}
                            disabled={loading}
                            style={styles.deleteButton}
                        >
                            X
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Inline styles for the component
const styles = {
    container: {
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
    },
    heading: {
        textAlign: "center",
        color: "#333",
    },
    button: {
        display: "block",
        width: "100%",
        padding: "10px",
        margin: "10px 0",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    error: {
        color: "red",
        textAlign: "center",
    },
    list: {
        listStyle: "none",
        padding: "0",
    },
    listItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
        borderBottom: "1px solid #ddd",
    },
    link: {
        color: "#007bff",
        textDecoration: "none",
    },
    deleteButton: {
        backgroundColor: "#ff4d4d",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "5px 10px",
        cursor: "pointer",
    },
};

export default BackupManager;