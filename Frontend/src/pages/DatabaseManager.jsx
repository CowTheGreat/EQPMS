import React, { useState } from "react";
import styles from '../page_styles/DatabaseManager.module.css';
import AddSubjects from "../components/AddSubjects/AddSubjects";
import DeleteSubject from "../components/DeleteSubject/DeleteSubject";
import AlterDeadline from "../components/AlterDeadline/AlterDeadline";
import ModifyPaper from "../components/ModifyPaper/ModifyPaper";
import UnlockAllPapers from "../components/UnlockAllPapers/UnlockAllPapers";

const DatabaseManager = () => {
  const [selectedAction, setSelectedAction] = useState(null);

  const renderComponent = () => {
    switch (selectedAction) {
      case "add":
        return <AddSubjects />;
      case "delete":
        return <DeleteSubject />;
      case "deadline":
        return <AlterDeadline />;
      case "modify":
        return <ModifyPaper />;
      case "unlock":
        return <UnlockAllPapers />;
      default:
        return <div className="text-center text-gray-500 mt-4">Select an action to begin</div>;
    }
  };

  return (
    <div className={styles.userManagementContainer}>
      <h1 className={styles.managementHeading}>Database Management System</h1>
      
      <div className={styles.actionButtons}>
        <button
          onClick={() => setSelectedAction("add")}
          className={`${styles.actionButton} ${styles.addButton}`}
        >
          Add Subject
        </button>
        <button
          onClick={() => setSelectedAction("delete")}
          className={`${styles.actionButton} ${styles.deleteButton}`}
        >
          Delete Subject
        </button>
        <button
          onClick={() => setSelectedAction("deadline")}
          className={`${styles.actionButton} ${styles.deadlineButton}`}
        >
          Alter Deadline
        </button>
        <button
          onClick={() => setSelectedAction("modify")}
          className={`${styles.actionButton} ${styles.modifyButton}`}
        >
          Modify Paper
        </button>
        <button
          onClick={() => setSelectedAction("unlock")}
          className={`${styles.actionButton} ${styles.unlockButton}`}
        >
          Unlock All Papers
        </button>
      </div>

      <div className={styles.cardContainer}>
        {renderComponent()}
      </div>
    </div>
  );
};

export default DatabaseManager;