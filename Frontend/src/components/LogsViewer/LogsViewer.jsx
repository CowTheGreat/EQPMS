import React, { useState, useEffect } from "react";

const LogsViewer = () => {
  const [logs, setLogs] = useState([]); // Stores the logs (lines from the text file)
  const [searchQuery, setSearchQuery] = useState(""); // Stores the search query
  const [filteredLogs, setFilteredLogs] = useState([]); // Stores the filtered logs

  // Function to fetch logs
  const fetchLogs = async () => {
    try {
      const response = await fetch("/logs.txt");
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }
      const data = await response.text();
      const lines = data.split("\n").filter((line) => line.trim() !== ""); // Split and filter empty lines
      const reversedLines = lines.reverse(); // Reverse the order of the logs
      setLogs(reversedLines); // Set the logs state with reversed logs
      setFilteredLogs(reversedLines); // Initialize filtered logs with reversed logs
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  // Fetch logs on component mount
  useEffect(() => {
    fetchLogs();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Filter logs based on the search query
    const filtered = logs.filter((line) =>
      line.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredLogs(filtered);
  };

  return (
    <div className="logs-viewer">
      <h2>Logs</h2>

      {/* Sync Button */}
      <button onClick={fetchLogs} className="sync-button">
        🔄 Sync Logs
      </button>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search logs..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-bar"
      />

      {/* List of Log Tiles */}
      <div className="logs-list">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((line, index) => (
            <div key={index} className="log-tile">
              {line}
            </div>
          ))
        ) : (
          <p>No logs found.</p>
        )}
      </div>
    </div>
  );
};

export default LogsViewer;
