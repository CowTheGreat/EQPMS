import React, { useState, useEffect } from "react";
import axios from "axios";

const DownloadFiles = () => {
  const [sessions, setSessions] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [boards, setBoards] = useState([]);

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}sessions`)
      .then((res) => setSessions(res.data));
  }, []);

  const handleSessionChange = async (e) => {
    const session = e.target.value;
    setSelectedSession(session);
    setSelectedDegree("");
    setSelectedBoard("");
    if (session) {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}degrees?session=${session}`
      );
      setDegrees(res.data);
    }
  };

  const handleDegreeChange = async (e) => {
    const degree = e.target.value;
    setSelectedDegree(degree);
    setSelectedBoard("");
    if (degree) {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }boards?session=${selectedSession}&degree=${degree}`
      );
      setBoards(res.data);
    }
  };

  const handleDownload = () => {
    if (!selectedSession || !selectedDegree || !selectedBoard) {
      alert("Please select all fields");
      return;
    }
    window.location.href = `${
      import.meta.env.VITE_API_BASE_URL
    }download?session=${selectedSession}&degree=${selectedDegree}&board=${selectedBoard}`;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h3>Download Exam Papers</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>Session: </label>
        <select onChange={handleSessionChange} value={selectedSession}>
          <option value="">Select Session</option>
          {sessions.map((session) => (
            <option key={session} value={session}>
              {session}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Degree: </label>
        <select
          onChange={handleDegreeChange}
          value={selectedDegree}
          disabled={!selectedSession}
        >
          <option value="">Select Degree</option>
          {degrees.map((degree) => (
            <option key={degree} value={degree}>
              {degree}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Board: </label>
        <select
          onChange={(e) => setSelectedBoard(e.target.value)}
          value={selectedBoard}
          disabled={!selectedDegree}
        >
          <option value="">Select Board</option>
          {boards.map((board) => (
            <option key={board} value={board}>
              {board}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleDownload}
        disabled={!selectedBoard}
        style={{ padding: "10px", cursor: "pointer" }}
      >
        Download All Files
      </button>
    </div>
  );
};

export default DownloadFiles;
