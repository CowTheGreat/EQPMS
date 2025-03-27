import React, { useState, useEffect } from "react";

const LogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/logs.txt");
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.text();
      const lines = data.split("\n").filter((line) => line.trim() !== "");
      const reversedLines = lines.reverse();
      setLogs(reversedLines);
      setFilteredLogs(reversedLines);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = logs.filter((line) =>
      line.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredLogs(filtered);
  };

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "600",
            color: "#333",
          }}
        >
          System Logs
        </h2>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={fetchLogs}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a90e2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#3a7bc8")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#4a90e2")}
          >
            <span>🔄</span> Refresh Logs
          </button>

          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              minWidth: "250px",
              flexGrow: 1,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxHeight: "70vh",
          overflowY: "auto",
          paddingRight: "8px",
        }}
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((line, index) => (
            <div
              key={index}
              style={{
                padding: "12px 16px",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                backgroundColor: "#fff",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
                wordBreak: "break-word",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#f5f5f5";
                e.target.style.borderColor = "#d0d0d0";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#fff";
                e.target.style.borderColor = "#e0e0e0";
              }}
            >
              <code
                style={{
                  fontFamily: "monospace",
                  fontSize: "17px",
                  color: "#333",
                  whiteSpace: "pre-wrap",
                }}
              >
                {line}
              </code>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#666",
              backgroundColor: "#fafafa",
              borderRadius: "6px",
              border: "1px dashed #e0e0e0",
            }}
          >
            No logs found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsViewer;
