import React, { useState } from "react";
import styles from "../page_styles/Utilities.module.css";
import AddSubjects from "../components/AddSubjects/AddSubjects";
import DeleteSubject from "../components/DeleteSubject/DeleteSubject";

import BackupManager from "../components/BackupManager/BackupManager";
import LogsViewer from "../components/LogsViewer/LogsViewer";

const Utilities = () => {
  const [selectedAction, setSelectedAction] = useState(null);

  const renderComponent = () => {
    switch (selectedAction) {
      case "backup":
        return <BackupManager />;
      case "logs":
        return <LogsViewer />;
      default:
        return (
          <div className="text-center text-gray-500 mt-4">
            Select an action to begin
          </div>
        );
    }
  };

  return (
    <div className={styles.userManagementContainer}>
      <h1 className={styles.managementHeading}>Database Management System</h1>

      <div className={styles.actionButtons}>
        <button
          onClick={() => setSelectedAction("backup")}
          className={`${styles.actionButton} ${styles.addButton}`}
        >
          Backup Manager
        </button>
        <button
          onClick={() => setSelectedAction("logs")}
          className={`${styles.actionButton} ${styles.deleteButton}`}
        >
          LogsViewer
        </button>
      </div>

      <div className={styles.cardContainer}>{renderComponent()}</div>
    </div>
  );
};

export default Utilities;
