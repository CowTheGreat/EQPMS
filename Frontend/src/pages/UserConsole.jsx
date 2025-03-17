import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../page_styles/UserConsole.module.css";
import { AiOutlineClose } from "react-icons/ai";
import { FiRefreshCw } from "react-icons/fi";
import axios from "axios";

const UserConsole = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    cb1: false,
    cb2: false,
    cb3: false,
  });
  const [assignments, setAssignments] = useState([]);
  const [selectedQP, setSelectedQP] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadMessages, setUploadMessages] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const fetchAssignments = () => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}user_data/${user.id}`)
      .then((response) => setAssignments(response.data.assignments))
      .catch((error) => console.error("Error fetching data:", error));
  };

  useEffect(() => {
    fetchAssignments();
  }, [user.id]);

  const refreshData = () => {
    fetchAssignments();
  };

  const fetchUploadedFile = async (qpRef) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}uploaded_files/${qpRef}`
      );
      setUploadedFiles((prev) => ({
        ...prev,
        [qpRef]: response.data.file_url,
      }));
    } catch (error) {
      setUploadedFiles((prev) => ({ ...prev, [qpRef]: null }));
    }
  };

  const refreshSingleQP = async () => {
    if (!selectedQP) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}user_data/${user.id}`
      );
      const updatedQP = response.data.assignments.find(
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
    handleSave();
    if (!file || !selectedQP) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", user.id);
    formData.append("qp_ref", selectedQP.QP_Ref_no);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadMessages((prev) => ({
        ...prev,
        [selectedQP.QP_Ref_no]: "✅ File Saved to Buffer Successfully!",
      }));

      await updateStatus(selectedQP.QP_Ref_no, "Saved");
      fetchUploadedFile(selectedQP.QP_Ref_no);
      setFile(null);

      setTimeout(() => {
        setUploadMessages((prev) => ({ ...prev, [selectedQP.QP_Ref_no]: "" }));
      }, 3000);
    } catch (error) {
      setUploadMessages((prev) => ({
        ...prev,
        [selectedQP.QP_Ref_no]: "❌ File upload failed.",
      }));
    }
  };

  const handleLockAndUpload = async () => {
    if (!selectedQP) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}lock_and_upload/${
          selectedQP.QP_Ref_no
        }`
      );

      setUploadMessages((prev) => ({
        ...prev,
        [selectedQP.QP_Ref_no]: "✅ File Locked and Uploaded Successfully!",
      }));

      await updateStatus(selectedQP.QP_Ref_no, "Locked");
      fetchUploadedFile(selectedQP.QP_Ref_no);

      setTimeout(() => {
        setUploadMessages((prev) => ({ ...prev, [selectedQP.QP_Ref_no]: "" }));
      }, 3000);
    } catch (error) {
      setUploadMessages((prev) => ({
        ...prev,
        [selectedQP.QP_Ref_no]: "❌ File lock and upload failed.",
      }));
    }
  };

  const updateStatus = async (qpRef, newStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}update_status/${qpRef}`,
        null,
        { params: { new_status: newStatus } }
      );

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

  const handleDownloadOrder = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}download_order/${user.id}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
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

  const handleSave = () => {
    updateStatus(selectedQP.QP_Ref_no, "Saved");
    setShowCheckboxes(true);
  };

  const handleCheckboxChange = (e) => {
    setCheckboxes({ ...checkboxes, [e.target.name]: e.target.checked });
  };

  const allChecked = checkboxes.cb1 && checkboxes.cb2 && checkboxes.cb3;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <h2>Welcome, {user.id}</h2>
          <button className={styles.download} onClick={handleDownloadOrder}>
            📥 Download Order
          </button>
        </div>
        <div className={styles.controls}>
          <button className={styles.refresh} onClick={refreshData}>
            <FiRefreshCw /> Refresh
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.assignmentsSection}>
          <h3>Your Assigned Question Papers</h3>
          <div className={styles.assignmentsGrid}>
            {assignments && assignments.length > 0 ? (
              assignments.map((qp, index) => {
                const deadlineDate = new Date(qp.QP_Deadline);
                const currentTime = new Date();
                const timeDiff = deadlineDate - currentTime;
                const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                let deadlineColor = "var(--success)";
                if (daysLeft > 10) deadlineColor = "var(--success)";
                else if (daysLeft > 5) deadlineColor = "var(--warning)";
                else deadlineColor = "var(--danger)";

                return (
                  <article
                    className={`${styles.assignmentCard} ${
                      qp.QP_Status === "Locked" ? styles.locked : ""
                    }`}
                    key={index}
                    onClick={() => {
                      if (qp.QP_Status !== "Locked") {
                        if (qp.QP_Status === "Assigned") {
                          updateStatus(qp.QP_Ref_no, "In Progress");
                        }
                        openModal(qp);
                      }
                    }}
                  >
                    <div className={styles.cardHeader}>
                      <h4>{qp.QP_Ref_no}</h4>
                      <span className={styles.statusBadge}>{qp.QP_Status}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <p className={styles.subject}>{qp.QP_Subject}</p>
                      <p className={styles.subjectCode}>
                        ({qp.QP_Subjectcode})
                      </p>
                      <div className={styles.deadline}>
                        <span style={{ color: deadlineColor }}>
                          {daysLeft >= 0
                            ? `⏳ ${daysLeft} days left`
                            : "❌ Deadline"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className={styles.noAssignments}>No assignments available</p>
            )}
          </div>
        </section>

        {selectedQP && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Question Paper Details</h3>
                <div className={styles.modalControls}>
                  <button
                    className={styles.refreshButton}
                    onClick={refreshSingleQP}
                    title="Refresh Status"
                  >
                    <FiRefreshCw />
                  </button>
                  <button
                    className={styles.closeButton}
                    onClick={() => (
                      setSelectedQP(null), setShowCheckboxes(false)
                    )}
                  >
                    <AiOutlineClose />
                  </button>
                </div>
              </div>

              <div className={styles.modalContent}>
                <div className={styles.qpDetails}>
                  <div className={styles.qpRow}>
                    <div className={styles.detailItem}>
                      <label>Reference No:</label>
                      <p>{selectedQP.QP_Ref_no}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Session:</label>
                      <p>{selectedQP.QP_Session}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Degree:</label>
                      <p>{selectedQP.QP_Degree}</p>
                    </div>
                  </div>

                  <div className={styles.qpRow}>
                    <div className={styles.detailItem}>
                      <label>Regulation:</label>
                      <p>{selectedQP.QP_Regulation}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Board:</label>
                      <p>{selectedQP.QP_Board}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Semester:</label>
                      <p>{selectedQP.QP_Semester}</p>
                    </div>
                  </div>

                  <div className={styles.qpRow}>
                    <div className={styles.detailItem}>
                      <label>Subject Code:</label>
                      <p>{selectedQP.QP_Subjectcode}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Subject:</label>
                      <p>{selectedQP.QP_Subject}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Status:</label>
                      <p>{selectedQP.QP_Status}</p>
                    </div>
                  </div>
                </div>

                {selectedQP.QP_Status === "Locked" ? (
                  <div className={styles.lockedMessage}>
                    ❌ This Question Paper has been Locked
                  </div>
                ) : (
                  <>
                    <div className={styles.fileSection}>
                      {uploadedFiles[selectedQP.QP_Ref_no] ? (
                        <a
                          href={uploadedFiles[selectedQP.QP_Ref_no]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.fileLink}
                        >
                          📄 View Uploaded File
                        </a>
                      ) : (
                        <p className={styles.noFile}>No file uploaded yet</p>
                      )}

                      {isEditing && (
                        <div className={styles.uploadControls}>
                          <input
                            type="file"
                            accept=".docx"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                          />
                          <button
                            onClick={handleFileUpload}
                            className={styles.uploadButton}
                          >
                            Save and Upload
                          </button>
                          {uploadMessages[selectedQP.QP_Ref_no] && (
                            <p className={styles.uploadMessage}>
                              {uploadMessages[selectedQP.QP_Ref_no]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {showCheckboxes && (
                      <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="cb1"
                            checked={checkboxes.cb1}
                            onChange={handleCheckboxChange}
                          />
                          <div className={styles.checkboxContent}>
                            Confirm Criteria 1
                          </div>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="cb2"
                            checked={checkboxes.cb2}
                            onChange={handleCheckboxChange}
                          />
                          <div className={styles.checkboxContent}>
                            Confirm Criteria 2
                          </div>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="cb3"
                            checked={checkboxes.cb3}
                            onChange={handleCheckboxChange}
                          />
                          <div className={styles.checkboxContent}>
                            Confirm Criteria 3
                          </div>
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedQP.QP_Status !== "Locked" && (
                <div className={styles.modalFooter}>
                  {selectedQP.QP_Status === "Saved" && (
                    <>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => {
                          updateStatus(selectedQP.QP_Ref_no, "In Progress");
                          setIsEditing(true);
                          setShowCheckboxes(false);
                          setCheckboxes({ cb1: false, cb2: false, cb3: false });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.primaryButton}
                        onClick={handleLockAndUpload}
                        disabled={!allChecked}
                      >
                        Final Lock and Upload
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserConsole;
