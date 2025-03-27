import React, { useState } from "react";
import styles from "../page_styles/Utilities.module.css";
import BackupManager from "../components/BackupManager/BackupManager";
import LogsViewer from "../components/LogsViewer/LogsViewer";
import BroadcastButton from "../components/BroadcastButton/BroadcastButton";

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
          <div
            className={`${styles.textCenter} ${styles.textGray500} ${styles.mt4}`}
          >
            Select an action to begin
          </div>
        );
    }
  };

  return (
    <div className={styles.userManagementContainer}>
      <h1 className={styles.managementHeading}>Admin Utilities</h1>

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
          Logs Viewer
        </button>
        <button className={`${styles.actionButton} ${styles.broadcastButton}`}>
          <BroadcastButton />
        </button>
      </div>

      <div className={styles.cardContainer}>{renderComponent()}</div>
    </div>
  );
};

export default Utilities;
