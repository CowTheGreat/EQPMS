import React, { useState } from "react";
import styles from "../page_styles/AccessQP.module.css";
import DropdownComponent from "./DropdownComponent";
import ViewPaper from "./ViewPaper";
import DownloadFiles from "../components/DownloadFiles/DownloadFiles";

const AccessQP = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <div className={styles.qpmsContainer}>
      <div className={styles.qpmsBox}>
        <h2 className={styles.qpmsTitle}>Select an Option</h2>

        <div className={styles.buttonsContainer}>
          <button
            className={`${styles.squareButton} ${
              selectedOption === "dropdown" ? styles.selected : ""
            }`}
            onClick={() => setSelectedOption("dropdown")}
          >
            QP Dropdown
          </button>
          <button
            className={`${styles.squareButton} ${
              selectedOption === "explorer" ? styles.selected : ""
            }`}
            onClick={() => setSelectedOption("explorer")}
          >
            QP Explorer
          </button>
          <button
            className={`${styles.squareButton} ${
              selectedOption === "download" ? styles.selected : ""
            }`}
            onClick={() => setSelectedOption("download")}
          >
            QP Download
          </button>
        </div>

        {/* Content Section */}
        <div className={styles.contentContainer}>
          {selectedOption === "dropdown" && <DropdownComponent />}
          {selectedOption === "download" && <DownloadFiles />}
          {selectedOption === "explorer" && <ViewPaper />}
        </div>
      </div>
    </div>
  );
};

export default AccessQP;
