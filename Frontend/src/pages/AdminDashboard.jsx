import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import FacultyList from "./FacultyList";
import styles from "../page_styles/AdminDashboard.module.css";
import BroadcastButton from "../components/BroadcastButton/BroadcastButton";

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [qps, setQps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}api/qps`
        );
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setQps(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusCounts = qps.reduce((acc, qp) => {
    const status = qp.QP_Status === "Locked" ? "Completed" : "Pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: ["Completed", "Pending"],
    datasets: [
      {
        label: "Status Distribution",
        data: [statusCounts.Completed || 0, statusCounts.Pending || 0],
        backgroundColor: ["#16a085", "#f1c40f"],
        borderColor: ["#fff", "#fff"],
        borderWidth: 2,
        hoverOffset: 20,
      },
    ],
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Question Paper Management Dashboard</h1>
        <BroadcastButton />
      </div>
      <div className={styles.topSection}>
        <div className={styles.boardsSection}>
          <h2>Status Table</h2>
          <StatusTable qps={qps} />
        </div>

        <div className={styles.chartSection}>
          <h2>Status Overview</h2>
          <div className={styles.chartContainer}>
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: {
                      color: "#1a237e",
                      font: { size: 14 },
                    },
                  },
                  tooltip: {
                    backgroundColor: "rgba(0,0,0,0.8)",
                    bodyFont: { size: 14 },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <section className={styles.facultySection}>
        <FacultyList />
      </section>
    </div>
  );
};

const StatusTable = ({ qps }) => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;

  const uniqueStatuses = [
    ...new Set(qps.map((qp) => qp.QP_Status).filter(Boolean)),
  ];

  const filteredQps =
    filterStatus === "All" ? qps : qps.filter((qp) => qp.QP_Status === filterStatus);

  const totalPages = Math.ceil(filteredQps.length / entriesPerPage);
  const currentData = filteredQps.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const generatePageNumbers = () => {
    const pages = [];
    const rangeStart = Math.max(1, currentPage - 2);
    const rangeEnd = Math.min(totalPages, currentPage + 2);

    if (rangeStart > 1) {
      pages.push(1);
      if (rangeStart > 2) pages.push("ellipsis");
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages) {
      if (rangeEnd < totalPages - 1) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Faculty</th>
            <th>Subject Code</th>
            <th>Subject</th>
            <th>
              <div className={styles.filterHeader}>
                Status
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={styles.filterDropdown}
                >
                  <option value="All">All</option>
                  {uniqueStatuses.map((status, index) => (
                    <option key={index} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((qp, index) => (
            <tr key={index}>
              <td>{qp.QP_Faculty_assigned}</td>
              <td>{qp.QP_Subjectcode}</td>
              <td>{qp.QP_Subject}</td>
              <td>{qp.QP_Status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          &laquo; Previous
        </button>

        {generatePageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? styles.activePage : ""}
            >
              {page}
            </button>
          ) : (
            <span key={index} className={styles.ellipsis}>
              ...
            </span>
          )
        )}

        <button
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Next &raquo;
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
