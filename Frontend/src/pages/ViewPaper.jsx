import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../page_styles/ViewPaper.module.css";

const ViewPaper = () => {
  const [path, setPath] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDownloadAll, setShowDownloadAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        let url = `${import.meta.env.VITE_API_BASE_URL}api/sessions/`;
        if (path.length === 1) {
          url = `${import.meta.env.VITE_API_BASE_URL}api/${encodeURIComponent(
            path[0]
          )}/degrees/`;
        } else if (path.length === 2) {
          url = `${import.meta.env.VITE_API_BASE_URL}api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/branches/`;
        } else if (path.length === 3) {
          url = `${import.meta.env.VITE_API_BASE_URL}api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/${encodeURIComponent(
            path[2]
          )}/regulations/`;
        } else if (path.length === 4) {
          url = `${import.meta.env.VITE_API_BASE_URL}api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/${encodeURIComponent(
            path[2]
          )}/${encodeURIComponent(path[3])}/semesters/`;
        } else if (path.length === 5) {
          url = `${import.meta.env.VITE_API_BASE_URL}api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/${encodeURIComponent(
            path[2]
          )}/${encodeURIComponent(path[3])}/${encodeURIComponent(
            path[4]
          )}/subjects/`;
        } else if (path.length === 6) {
          url = `${import.meta.env.VITE_API_BASE_URL}api/${encodeURIComponent(
            path[0]
          )}/${encodeURIComponent(path[1])}/${encodeURIComponent(
            path[2]
          )}/${encodeURIComponent(path[3])}/${encodeURIComponent(
            path[4]
          )}/${encodeURIComponent(path[5])}/files/`;
          setShowDownloadAll(true);
        } else {
          setShowDownloadAll(false);
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

  const handleFileClick = (url, filename) => {
    const downloadUrl = `${
      import.meta.env.VITE_API_BASE_URL
    }download${url.replace("/content", "")}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRevealInExplorer = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}api/reveal-in-explorer/`,
        {
          path: path.join("/"),
        },
        {
          timeout: 1000,
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

  const handleDownloadAll = async () => {
    try {
      setError("");
      if (path.length === 6) {
        const encodedPath = path.map((p) => encodeURIComponent(p));
        const [session, degree, branch, regulation, semester, subject] =
          encodedPath;

        const response = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL
          }download-all/${session}/${degree}/${branch}/${regulation}/${semester}/${subject}`,
          {
            responseType: "blob",
            // Handle 400/500 status codes as errors
            validateStatus: (status) => status >= 200 && status < 300,
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${path[5]}_papers.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      let errorMessage = "Failed to download files";

      try {
        // Try to read error message from blob
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        errorMessage = json.detail || errorMessage;
      } catch {
        errorMessage = err.message || errorMessage;
      }

      setError(`Download error: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Question Paper Repository</h1>
      </div>

      <div className={styles.breadcrumbs}>
        <div className={styles.breadcrumbsLeft}>
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

        <div className={styles.buttonGroup}>
          {showDownloadAll && (
            <button
              className={styles.downloadAllButton}
              onClick={handleDownloadAll}
            >
              Download All
            </button>
          )}
          <button
            className={styles.revealButton}
            onClick={handleRevealInExplorer}
          >
            Reveal in Explorer
          </button>
        </div>
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
              onClick={() => handleFileClick(item.url, item.name)}
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
