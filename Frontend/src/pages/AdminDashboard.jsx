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
    const status = qp.QP_status === "Completed" ? "Completed" : "Pending";
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
      <BroadcastButton />
      <h1 className={styles.title}>Question Paper Management Dashboard</h1>

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

      <section className={styles.facultySection}>
        <FacultyList />
      </section>
    </div>
  );
};

export default AdminDashboard;
