import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../page_styles/UserConsole.module.css";
import { AiOutlineClose } from "react-icons/ai";
import { FiRefreshCw } from "react-icons/fi";

const UserConsole = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  console.log("User:", user.id);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [assignments, setAssignments] = useState([]);
  const [selectedQP, setSelectedQP] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadMessages, setUploadMessages] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const fetchAssignments = async () => {
    try {
      console.log("Fetching assignments for user:", user.id);

      const response = await fetch(
        `http://localhost:8080/user_data/${user.id}`
      );
      const data = await response.json();
      setAssignments(data.assignments);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user.id]);

  const refreshData = () => {
    fetchAssignments();
  };

  const fetchUploadedFile = async (qpRef) => {
    try {
      const response = await fetch(
        `http://localhost:8080/uploaded_files/${qpRef}`
      );
      const data = await response.json();
      setUploadedFiles((prev) => ({
        ...prev,
        [qpRef]: data.file_url,
      }));
    } catch (error) {
      console.error("No uploaded file found:", error);
      setUploadedFiles((prev) => ({
        ...prev,
        [qpRef]: null,
      }));
    }
  };

  const refreshSingleQP = async () => {
    if (!selectedQP) return;

    try {
      const response = await fetch(
        `http://localhost:8080/user_data/${user.id}`
      );
      const data = await response.json();
      const updatedQP = data.assignments.find(
        (qp) => qp.QP_Ref_no === selectedQP.QP_Ref_no
      );

      if (updatedQP) {
        setSelectedQP(updatedQP);
        setIsEditing(updatedQP.QP_Status === "In Progress");
        fetchUploadedFile(updatedQP.QP_Ref_no);
      }
    } catch (error) {
      console.error("Error refreshing single QP:", error);
    }
  };

  const openModal = (qp) => {
    setSelectedQP(qp);
    setIsEditing(qp.QP_Status === "In Progress");
    fetchUploadedFile(qp.QP_Ref_no);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file || !selectedQP) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", user.id);
    formData.append("qp_ref", selectedQP.QP_Ref_no);

    try {
      const response = await fetch("http://localhost:8080/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadMessages((prev) => ({
          ...prev,
          [selectedQP.QP_Ref_no]: "✅ File Updated Successfully!",
        }));
        fetchUploadedFile(selectedQP.QP_Ref_no);
        setFile(null);
        setTimeout(() => {
          setUploadMessages((prev) => ({
            ...prev,
            [selectedQP.QP_Ref_no]: "",
          }));
        }, 3000);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      setUploadMessages((prev) => ({
        ...prev,
        [selectedQP.QP_Ref_no]: "❌ File upload failed.",
      }));
    }
  };

  const handleDownloadOrder = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/download_order/${user.id}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `QP_Order_${user.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading order:", error);
    }
  };

  const updateStatus = async (qpRef, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:8080/update_status/${qpRef}?new_status=${newStatus}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) throw new Error("Status update failed");

      setAssignments(
        assignments.map((qp) =>
          qp.QP_Ref_no === qpRef ? { ...qp, QP_Status: newStatus } : qp
        )
      );

      if (selectedQP?.QP_Ref_no === qpRef) {
        setSelectedQP((prev) => ({ ...prev, QP_Status: newStatus }));
        setIsEditing(newStatus === "In Progress");

        if (newStatus === "Saved" || newStatus === "Locked") {
          fetchUploadedFile(qpRef);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className={styles.container}>
        <h2>Welcome, {user.id}</h2>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
        <button className="refresh-btn" onClick={refreshData}>
          🔄 Refresh
        </button>
        <button className="download-btn" onClick={handleDownloadOrder}>
          📥 Download Order
        </button>

        <h3>Your Assigned Question Papers</h3>
        <ul className={styles.assignmentList}>
          {assignments && assignments.length > 0 ? (
            assignments.map((qp, index) => (
              <li
                key={index}
                onClick={() => {
                  if (qp.QP_Status !== "Locked") {
                    if (qp.QP_Status === "Assigned") {
                      updateStatus(qp.QP_Ref_no, "In Progress");
                    }
                    openModal(qp);
                  }
                }}
                style={{
                  cursor: qp.QP_Status !== "Locked" ? "pointer" : "not-allowed",
                  opacity: qp.QP_Status === "Locked" ? 0.6 : 1,
                }}
                className={styles.assignmentItem}
              >
                <strong>{qp.QP_Ref_no}&nbsp;</strong>
                {qp.QP_Subject} ({qp.QP_Subjectcode}) - Status: {qp.QP_Status}
              </li>
            ))
          ) : (
            <p>No assignments available</p>
          )}
        </ul>

        {selectedQP && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <FiRefreshCw
                  className={styles.refreshIcon}
                  onClick={refreshSingleQP}
                  title="Refresh Status"
                />
                <AiOutlineClose
                  className={styles.closeBtn}
                  onClick={() => setSelectedQP(null)}
                />
              </div>

              <h3>Question Paper Details</h3>
              <div className={styles.qpDetails}>
                <div className={styles.qpRow}>
                  <p>
                    <strong>Reference No:</strong> {selectedQP.QP_Ref_no}
                  </p>
                  <p>
                    <strong>Session:</strong> {selectedQP.QP_Session}
                  </p>
                  <p>
                    <strong>Degree:</strong> {selectedQP.QP_Degree}
                  </p>
                </div>
                <div className={styles.qpRow}>
                  <p>
                    <strong>Regulation:</strong> {selectedQP.QP_Regulation}
                  </p>
                  <p>
                    <strong>Board:</strong> {selectedQP.QP_Board}
                  </p>
                  <p>
                    <strong>Semester:</strong> {selectedQP.QP_Semester}
                  </p>
                </div>
                <div className={styles.qpRow}>
                  <p>
                    <strong>Subject Code:</strong> {selectedQP.QP_Subjectcode}
                  </p>
                  <p>
                    <strong>Subject:</strong> {selectedQP.QP_Subject}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedQP.QP_Status}
                  </p>
                </div>
              </div>

              {selectedQP.QP_Status === "Locked" ? (
                <p className="locked-message">
                  ❌ This Question Paper has been Locked.
                </p>
              ) : (
                <>
                  {isEditing && (
                    <div className="file-upload-container">
                      <input
                        type="file"
                        accept=".docx"
                        onChange={handleFileChange}
                      />
                      <button onClick={handleFileUpload}>Upload</button>

                      {/* ✅ Show File Upload Status Message */}
                      {uploadMessages[selectedQP.QP_Ref_no] && (
                        <p className="upload-message">
                          {uploadMessages[selectedQP.QP_Ref_no]}
                        </p>
                      )}
                    </div>
                  )}

                  {uploadedFiles[selectedQP.QP_Ref_no] ? (
                    <a
                      href={uploadedFiles[selectedQP.QP_Ref_no]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📄 View Uploaded File
                    </a>
                  ) : (
                    <p>No file uploaded yet.</p>
                  )}

                  {selectedQP.QP_Status === "Assigned" ||
                  selectedQP.QP_Status === "In Progress" ? (
                    <button
                      onClick={() =>
                        updateStatus(selectedQP.QP_Ref_no, "Saved")
                      }
                    >
                      Save
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          updateStatus(selectedQP.QP_Ref_no, "In Progress");
                          setIsEditing(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          updateStatus(selectedQP.QP_Ref_no, "Locked")
                        }
                      >
                        Lock
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserConsole;
