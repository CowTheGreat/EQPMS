import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../page_styles/ViewPaper.module.css";

const ViewPaper = () => {
  const [path, setPath] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        let url = "http://localhost:8080/api/sessions/";
        if (path.length === 1) {
          url = `http://localhost:8080/api/${encodeURIComponent(
            path[0]
          )}/regulations/`;
        } else if (path.length === 2) {
          url = `http://localhost:8080/api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/boards/`;
        } else if (path.length === 3) {
          url = `http://localhost:8080/api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/${encodeURIComponent(
            path[2]
          )}/semesters/`;
        } else if (path.length === 4) {
          url = `http://localhost:8080/api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/${encodeURIComponent(
            path[2]
          )}/${encodeURIComponent(path[3])}/subjects/`;
        } else if (path.length === 5) {
          url = `http://localhost:8080/api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/${encodeURIComponent(
            path[2]
          )}/${encodeURIComponent(path[3])}/${encodeURIComponent(
            path[4]
          )}/files/`;
        }

        const response = await axios.get(url);
        setItems(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [path]);

  const handleFolderClick = (value) => {
    setPath((prev) => [...prev, value]);
  };

  const handleBreadcrumbClick = (index) => {
    setPath((prev) => prev.slice(0, index + 1));
  };

  const handleFileClick = (url) => {
    window.open(`http://localhost:8080${url}`, "_blank");
  };

  const handleRevealInExplorer = async () => {
    try {
      // Fire-and-forget request
      await axios.post(
        "http://localhost:8080/api/reveal-in-explorer/",
        {
          path: path.join("/"),
        },
        {
          timeout: 1000, // Short timeout just to catch immediate errors
        }
      );
    } catch (err) {
      if (!err.response || err.code !== "ECONNABORTED") {
        setError(
          "Failed to open explorer: " + (err.message || "Unknown error")
        );
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Question Paper Repository</h1>
        <button
          className={styles.revealButton}
          onClick={handleRevealInExplorer}
          disabled={path.length === 0}
        >
          Reveal in Explorer
        </button>
      </div>

      <div className={styles.breadcrumbs}>
        <button
          className={styles.breadcrumbItem}
          onClick={() => setPath([])}
          disabled={path.length === 0}
        >
          Home
        </button>
        {path.map((segment, index) => (
          <React.Fragment key={index}>
            <span className={styles.separator}>/</span>
            <button
              className={styles.breadcrumbItem}
              onClick={() => handleBreadcrumbClick(index)}
            >
              {segment}
            </button>
          </React.Fragment>
        ))}
      </div>

      {loading && <div className={styles.loading}>Loading...</div>}
      {error && <div className={styles.error}>Error: {error}</div>}

      <div className={styles.grid}>
        {items.map((item) =>
          "value" in item ? (
            <div
              key={item.value}
              className={styles.card}
              onClick={() => handleFolderClick(item.value)}
            >
              <div className={styles.folderIcon}>📁</div>
              <div className={styles.itemName}>{item.label}</div>
            </div>
          ) : (
            <div
              key={item.url}
              className={styles.card}
              onClick={() => handleFileClick(item.url)}
            >
              <div className={styles.fileIcon}>📄</div>
              <div className={styles.itemName}>{item.name}</div>
            </div>
          )
        )}
      </div>

      {items.length === 0 && !loading && !error && (
        <div className={styles.empty}>No items found in this directory</div>
      )}
    </div>
  );
};

export default ViewPaper;
