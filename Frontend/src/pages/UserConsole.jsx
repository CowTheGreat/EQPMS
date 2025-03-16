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
  console.log("User:", user.id);

  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    cb1: false,
    cb2: false,
    cb3: false,
  });

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

  const [assignments, setAssignments] = useState([]);
  const [selectedQP, setSelectedQP] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadMessages, setUploadMessages] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // ${import.meta.env.VITE_API_BASE_URL}

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
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}user_data/${user.id}`
      );
      const updatedQP = response.data.assignments.find(
        (qp) => qp.QP_Ref_no === selectedQP.QP_Ref_no
      );
      if (updatedQP) {
        setSelectedQP(updatedQP);
        setIsEditing(updatedQP.QP_Status === "In Progress");
        fetchUploadedFile(updatedQP.QP_Ref_no); // Fetch file on refresh
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
    if (!file || !selectedQP) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", user.id);
    formData.append("qp_ref", selectedQP.QP_Ref_no);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setUploadMessages((prev) => ({
        ...prev,
        [selectedQP.QP_Ref_no]: "✅ File Saved to Buffer Successfully!",
      }));

      // Update status to "Saved"
      await updateStatus(selectedQP.QP_Ref_no, "Saved");

      fetchUploadedFile(selectedQP.QP_Ref_no); // Refresh the uploaded file immediately
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
    if (!selectedQP) {
      return;
    }

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

      // Update status to "Locked"
      await updateStatus(selectedQP.QP_Ref_no, "Locked");

      fetchUploadedFile(selectedQP.QP_Ref_no); // Refresh the uploaded file immediately

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
        {
          params: { new_status: newStatus },
        }
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
          fetchUploadedFile(qpRef); // Refresh file after saving/locking
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
        {
          responseType: "blob",
        }
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

  return (
    <div style={{ padding: "20px" }}>
      <div className={styles.container}>
        <h2>Welcome, {user.id}</h2>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
        <button className={styles.refresh} onClick={refreshData}>
          🔄 Refresh
        </button>
        <button className={styles.download} onClick={handleDownloadOrder}>
          📥 Download Order
        </button>

        <h3>Your Assigned Question Papers</h3>
        <ul className={styles.assignmentList}>
          {assignments && assignments.length > 0 ? (
            assignments.map((qp, index) => {
              const deadlineDate = new Date(qp.QP_Deadline);
              const currentTime = new Date();
              const timeDiff = deadlineDate - currentTime;
              const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert ms to days

              let deadlineColor = "black"; // Default color
              if (daysLeft > 10) deadlineColor = "green"; // More than 10 days
              else if (daysLeft > 5) deadlineColor = "orange"; // 6 to 10 days
              else deadlineColor = "red"; // 5 or less

              return (
                <li
                  className={styles.assignmentListItem}
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
                    cursor:
                      qp.QP_Status !== "Locked" ? "pointer" : "not-allowed",
                    opacity: qp.QP_Status === "Locked" ? 0.6 : 1,
                  }}
                >
                  <strong>{qp.QP_Ref_no}&nbsp;</strong>
                  {qp.QP_Subject} ({qp.QP_Subjectcode}) - Status: {qp.QP_Status}
                  <span style={{ color: deadlineColor, marginLeft: "10px" }}>
                    {daysLeft >= 0 ? `⏳ ${daysLeft} days left` : "❌ Deadline"}
                  </span>
                </li>
              );
            })
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
                  onClick={() => (
                    setSelectedQP(null), setShowCheckboxes(false)
                  )}
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
                  {/* Deadline Calculation and Color Coding */}
                  {(() => {
                    const deadlineDate = new Date(selectedQP.QP_Deadline);
                    const today = new Date();
                    const timeDifference = deadlineDate - today;
                    const daysLeft = Math.ceil(
                      timeDifference / (1000 * 60 * 60 * 24)
                    );

                    let deadlineColor = "green";
                    if (daysLeft <= 10 && daysLeft > 5)
                      deadlineColor = "orange";
                    else if (daysLeft <= 5) deadlineColor = "red";

                    return (
                      <p>
                        <strong>Deadline:</strong>{" "}
                        <span style={{ color: deadlineColor }}>
                          {daysLeft > 0
                            ? `${daysLeft} days left`
                            : "Deadline Passed"}
                        </span>
                      </p>
                    );
                  })()}
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
                  {/* Display the "View Uploaded File" link regardless of isEditing */}
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

                  {isEditing && (
                    <div className="file-upload-container">
                      <input
                        type="file"
                        accept=".docx"
                        onChange={handleFileChange}
                      />
                      <button onClick={handleFileUpload}>
                        Save and Upload
                      </button>

                      {/* Show File Upload Status Message */}
                      {uploadMessages[selectedQP.QP_Ref_no] && (
                        <p className="upload-message">
                          {uploadMessages[selectedQP.QP_Ref_no]}
                        </p>
                      )}
                    </div>
                  )}

                  {showCheckboxes && (
                    <div className="checkboxes">
                      <label>
                        <input
                          className={styles.checklistCheckBox}
                          type="checkbox"
                          name="cb1"
                          checked={checkboxes.cb1}
                          onChange={handleCheckboxChange}
                        />{" "}
                        Confirm Criteria 1
                      </label>
                      <label>
                        <input
                          className={styles.checklistCheckBox}
                          type="checkbox"
                          name="cb2"
                          checked={checkboxes.cb2}
                          onChange={handleCheckboxChange}
                        />{" "}
                        Confirm Criteria 2
                      </label>
                      <label>
                        <input
                          className={styles.checklistCheckBox}
                          type="checkbox"
                          name="cb3"
                          checked={checkboxes.cb3}
                          onChange={handleCheckboxChange}
                        />{" "}
                        Confirm Criteria 3
                      </label>
                    </div>
                  )}

                  {selectedQP.QP_Status === "Saved" && (
                    <>
                      <button
                        onClick={() => {
                          updateStatus(selectedQP.QP_Ref_no, "In Progress");
                          setIsEditing(true);
                          setShowCheckboxes(false);
                          setCheckboxes({ cb1: false, cb2: false, cb3: false }); // Reset checkboxes
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleLockAndUpload}
                        disabled={!allChecked}
                      >
                        Lock and Upload
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
