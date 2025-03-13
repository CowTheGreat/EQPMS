import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../page_styles/DropdownComponent.module.css";

const DropdownComponent = () => {
  const [selections, setSelections] = useState({
    session: "",
    degree: "",
    branch: "",
    regulation: "",
    semester: "",
    subject: "",
  });

  const [options, setOptions] = useState({
    sessions: [],
    degrees: [],
    branches: [],
    regulations: [],
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

  // Fetch degrees when session changes
  useEffect(() => {
    if (selections.session) {
      setLoading("Fetching degrees...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/degrees/`,
        "degrees",
        ["branches", "regulations", "semesters", "subjects"]
      );
    }
  }, [selections.session]);

  // Fetch branches when degree changes
  useEffect(() => {
    if (selections.degree) {
      setLoading("Fetching branches...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/${encodeURIComponent(selections.degree)}/branches/`,
        "branches",
        ["regulations", "semesters", "subjects"]
      );
    }
  }, [selections.degree]);

  // Fetch regulations when branch changes
  useEffect(() => {
    if (selections.branch) {
      setLoading("Fetching regulations...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/${encodeURIComponent(selections.degree)}/${encodeURIComponent(
          selections.branch
        )}/regulations/`,
        "regulations",
        ["semesters", "subjects"]
      );
    }
  }, [selections.branch]);

  // Fetch semesters when regulation changes
  useEffect(() => {
    if (selections.regulation) {
      setLoading("Fetching semesters...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/${encodeURIComponent(selections.degree)}/${encodeURIComponent(
          selections.branch
        )}/${encodeURIComponent(selections.regulation)}/semesters/`,
        "semesters",
        ["subjects"]
      );
    }
  }, [selections.regulation]);

  // Fetch subjects when semester changes
  useEffect(() => {
    if (selections.semester) {
      setLoading("Fetching subjects...");
      fetchData(
        `http://localhost:8080/api/${encodeURIComponent(
          selections.session
        )}/${encodeURIComponent(selections.degree)}/${encodeURIComponent(
          selections.branch
        )}/${encodeURIComponent(selections.regulation)}/${encodeURIComponent(
          selections.semester
        )}/subjects/`,
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
            )}/${encodeURIComponent(selections.degree)}/${encodeURIComponent(
              selections.branch
            )}/${encodeURIComponent(
              selections.regulation
            )}/${encodeURIComponent(selections.semester)}/${encodeURIComponent(
              selections.subject
            )}/files/`
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
        degree: "",
        branch: "",
        regulation: "",
        semester: "",
        subject: "",
      }),
      ...(type === "degree" && {
        branch: "",
        regulation: "",
        semester: "",
        subject: "",
      }),
      ...(type === "branch" && { regulation: "", semester: "", subject: "" }),
      ...(type === "regulation" && { semester: "", subject: "" }),
      ...(type === "semester" && { subject: "" }),
    }));
  };

  return (
    <div className={styles.qpmsContainer}>
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
              <label className={styles.dropdownLabel}>Degree</label>
              <Dropdown
                label="Degree"
                options={options.degrees}
                value={selections.degree}
                onChange={(e) => handleChange("degree", e.target.value)}
                className={styles.dropdownSelect}
              />
            </div>
          )}

          {selections.degree && (
            <div className={styles.dropdownGroup}>
              <label className={styles.dropdownLabel}>Branch</label>
              <Dropdown
                label="Branch"
                options={options.branches}
                value={selections.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
                className={styles.dropdownSelect}
              />
            </div>
          )}

          {selections.branch && (
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
                    onClick={() => {
                      // Create download URL by replacing '/content' with '/download'
                      const downloadUrl = `http://localhost:8080/download${file.url.replace(
                        "/content",
                        ""
                      )}`;
                      const link = document.createElement("a");
                      link.href = downloadUrl;
                      link.download = file.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
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
