import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import styles from "./AssignedQpList.module.css";

const AssignedQpList = () => {
  const [qps, setQps] = useState([]);
  const [facultyStats, setFacultyStats] = useState([]);
  const [filters, setFilters] = useState({
    QP_Faculty_assigned: "",
    QP_Faculty_assigned_Regno: "",
    QP_Status: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}api/qps`
        );
        const sortedData = response.data.sort((a, b) => {
          return a.QP_Faculty_assigned.localeCompare(b.QP_Faculty_assigned);
        });

        setQps(sortedData);

        // Calculate faculty statistics
        const stats = {};
        sortedData.forEach((qp) => {
          if (!qp.QP_Faculty_assigned_Regno) return;
          
          if (!stats[qp.QP_Faculty_assigned_Regno]) {
            stats[qp.QP_Faculty_assigned_Regno] = {
              facultyName: qp.QP_Faculty_assigned,
              regNo: qp.QP_Faculty_assigned_Regno,
              totalAssigned: 0,
              completed: 0
            };
          }
          
          stats[qp.QP_Faculty_assigned_Regno].totalAssigned++;
          if (qp.QP_Status === "Locked") {
            stats[qp.QP_Faculty_assigned_Regno].completed++;
          }
        });

        setFacultyStats(Object.values(stats));
      } catch (error) {
        console.error(
          "Error fetching data:",
          error.response ? error.response.data : error.message
        );
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (column, value) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setCurrentPage(1);
  };

  const filteredFaculty = facultyStats.filter((faculty) => {
    return Object.entries(filters).every(([column, filterValue]) => {
      if (filterValue === "all" || filterValue === "") return true;
      
      const facultyValue = faculty[column === "QP_Faculty_assigned" ? "facultyName" : "regNo"];
      
      return facultyValue
        .toString()
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    });
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFaculty.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDownloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const title = "Faculty Assignment Report";

    const headers = [
      [
        "Ref No.",
        "Faculty",
        "Faculty RegNo", 
        "Papers Assigned",
        "Status"
      ],
    ];

    const data = filteredFaculty.map((faculty) => [
      faculty.regNo,
      faculty.facultyName,
      faculty.regNo,
      faculty.totalAssigned,
      `${faculty.completed}/${faculty.totalAssigned} Completed`
    ]);

    doc.setFontSize(16);
    doc.text(title, 14, 10);

    doc.autoTable({
      head: headers,
      body: data,
      theme: "grid",
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [44, 62, 80] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save("faculty-assignments-report.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredFaculty.map((faculty) => ({
        "Faculty RegNo": faculty.regNo,
        "Faculty Name": faculty.facultyName,
        "Papers Assigned": faculty.totalAssigned,
        "Status": `${faculty.completed}/${faculty.totalAssigned} Completed`
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty Assignments");
    XLSX.writeFile(workbook, "faculty-assignments-report.xlsx");
  };

  const renderFilter = (column, label) => {
    if (column === "QP_Status") {
      return (
        <div className={styles.headerContainer}>
          <div className={styles.headerLabel}>{label}</div>
          <div className={styles.filterContainer}>
            <select
              value={filters[column]}
              onChange={(e) => handleFilterChange(column, e.target.value)}
              className={styles.headerSelect}
            >
              <option value="all">All</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.headerContainer}>
        <div className={styles.headerLabel}>{label}</div>
        <div className={styles.filterContainer}>
          <input
            type="text"
            placeholder={`Search ${label}`}
            value={filters[column]}
            onChange={(e) => handleFilterChange(column, e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Faculty Assignment Summary</h1>
        <div className={styles.downloadButtons}>
          <button className={styles.downloadButton} onClick={handleDownloadPDF}>
            Download as PDF
          </button>
          <button
            className={styles.downloadButton}
            onClick={handleDownloadExcel}
          >
            Download as Excel
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{renderFilter("QP_Ref_no", "Ref No.")}</th>
              <th>{renderFilter("QP_Faculty_assigned", "Faculty")}</th>
              <th>{renderFilter("QP_Faculty_assigned_Regno", "Faculty RegNo")}</th>
              <th>Papers Assigned</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((faculty) => (
              <tr key={faculty.regNo} className={styles.row}>
                <td>{faculty.regNo}</td>
                <td>{faculty.facultyName}</td>
                <td>{faculty.regNo}</td>
                <td>{faculty.totalAssigned}</td>
                <td>
                  <span
                    className={styles.statusBadge}
                    data-status={`${faculty.completed}/${faculty.totalAssigned}`}
                  >
                    {faculty.completed}/{faculty.totalAssigned} Completed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        {Array.from(
          { length: Math.ceil(filteredFaculty.length / itemsPerPage) },
          (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`${styles.pageButton} ${
                currentPage === i + 1 ? styles.active : ""
              }`}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default AssignedQpList;