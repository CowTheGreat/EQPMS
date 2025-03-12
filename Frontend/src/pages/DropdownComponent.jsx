import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../page_styles/DropdownComponent.module.css";

const DropdownComponent = () => {
  const [selections, setSelections] = useState({
    session: "",
    regulation: "",
    board: "",
    semester: "",
    subject: "",
  });

  const [options, setOptions] = useState({
    sessions: [],
    regulations: [],
    boards: [],
    semesters: [],
    subjects: [],
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  // Unified fetch function with error handling
  const fetchData = async (url, optionKey, resetKeys = []) => {
    try {
      const { data } = await axios.get(url);
      setOptions((prev) => ({
        ...prev,
        [optionKey]: data,
        ...Object.fromEntries(resetKeys.map((k) => [k, []])),
      }));
      setError("");
    } catch (err) {
      setError(`Failed to load ${optionKey}: ${err.message}`);
      console.error("API Error:", err.response?.data || err.message);
    }
    setLoading("");
  };

  // Fetch initial sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading("Fetching sessions...");
      await fetchData("http://localhost:8080/api/sessions/", "sessions");
    };
    fetchSessions();
  }, []);

  // Fetch regulations when session changes
  useEffect(() => {
    if (selections.session) {
      setLoading("Fetching regulations...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/regulations/`,
        "regulations",
        ["boards", "semesters", "subjects"]
      );
    }
  }, [selections.session]);

  // Fetch boards when regulation changes
  useEffect(() => {
    if (selections.regulation) {
      setLoading("Fetching boards...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/${encodeURIComponent(selections.regulation)}/boards/`,
        "boards",
        ["semesters", "subjects"]
      );
    }
  }, [selections.regulation]);

  // Fetch semesters when board changes
  useEffect(() => {
    if (selections.board) {
      setLoading("Fetching semesters...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/${encodeURIComponent(selections.regulation)}/${encodeURIComponent(
          selections.board
        )}/semesters/`,
        "semesters",
        ["subjects"]
      );
    }
  }, [selections.board]);

  // Fetch subjects when semester changes
  useEffect(() => {
    if (selections.semester) {
      setLoading("Fetching subjects...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/${encodeURIComponent(selections.regulation)}/${encodeURIComponent(
          selections.board
        )}/${encodeURIComponent(selections.semester)}/subjects/`,
        "subjects"
      );
    }
  }, [selections.semester]);

  // Fetch files when subject changes
  useEffect(() => {
    const fetchFiles = async () => {
      if (selections.subject) {
        try {
          setLoading("Fetching files...");
          const { data } = await axios.get(
            `http://localhost:8080/api/${encodeURIComponent(
              selections.session
            )}/${encodeURIComponent(
              selections.regulation
            )}/${encodeURIComponent(selections.board)}/${encodeURIComponent(
              selections.semester
            )}/${encodeURIComponent(selections.subject)}/files/`
          );
          setFiles(data);
          setError("");
        } catch (err) {
          setError(`Failed to load files: ${err.message}`);
          console.error("Files Error:", err.response?.data || err.message);
        }
        setLoading("");
      }
    };
    fetchFiles();
  }, [selections.subject]);

  const handleChange = (type, value) => {
    setSelections((prev) => ({
      ...prev,
      [type]: value,
      ...(type === "session" && {
        regulation: "",
        board: "",
        semester: "",
        subject: "",
      }),
      ...(type === "regulation" && { board: "", semester: "", subject: "" }),
      ...(type === "board" && { semester: "", subject: "" }),
      ...(type === "semester" && { subject: "" }),
    }));
  };

  return (
    <div className={styles.Container}>
      <div className={styles.qpmsBox}>
        <h1 className={styles.qpmsTitle}>Question Paper Management System</h1>

        <div className={styles.dropdownsContainer}>
          <div className={styles.dropdownGroup}>
            <label className={styles.dropdownLabel}>Academic Session</label>
            <Dropdown
              label="Session"
              options={options.sessions}
              value={selections.session}
              onChange={(e) => handleChange("session", e.target.value)}
              className={styles.dropdownSelect}
            />
          </div>

          {selections.session && (
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Regulation</label>
              <Dropdown
                label="Regulation"
                options={options.regulations}
                value={selections.regulation}
                onChange={(e) => handleChange("regulation", e.target.value)}
                className={styles.dropdownSelect}
              />
            </div>
          )}

          {selections.regulation && (
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Department</label>
              <Dropdown
                label="Board"
                options={options.boards}
                value={selections.board}
                onChange={(e) => handleChange("board", e.target.value)}
                className={styles.dropdownSelect}
              />
            </div>
          )}

          {selections.board && (
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Semester</label>
              <Dropdown
                label="Semester"
                options={options.semesters}
                value={selections.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                className={styles.dropdownSelect}
              />
            </div>
          )}

          {selections.semester && (
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Subject</label>
              <Dropdown
                label="Subject"
                options={options.subjects}
                value={selections.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                className={styles.dropdownSelect}
              />
            </div>
          )}

          {loading && <div className={styles.loadingText}>{loading}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {files.length > 0 && (
            <div className={styles.fileListContainer}>
              <h3 className={styles.fileListTitle}>
                Available Question Papers
              </h3>
              <div className={styles.fileList}>
                {files.map((file) => (
                  <div
                    key={file.url}
                    className={styles.fileItem}
                    onClick={() =>
                      window.open(`http://localhost:8080${file.url}`, "_blank")
                    }
                  >
                    📄 {file.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dropdown = ({ label, options, value, onChange, className }) => (
  <select
    className={`${styles.dropdownSelect} ${className}`}
    value={value}
    onChange={onChange}
  >
    <option value="">Select {label}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export default DropdownComponent;
