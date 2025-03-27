import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import styles from "./AssignedQpList.module.css";

const AssignedQpList = () => {
  const [qps, setQps] = useState([]);
  const [facultyStats, setFacultyStats] = useState([]);
  const [filters, setFilters] = useState({
    QP_Faculty_assigned: "",
    QP_Faculty_assigned_Regno: "",
    QP_Status: "all",
    QP_Ref_no: ""
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

        const stats = {};
        sortedData.forEach((qp) => {
          if (!qp.QP_Faculty_assigned_Regno) return;
          
          if (!stats[qp.QP_Faculty_assigned_Regno]) {
            stats[qp.QP_Faculty_assigned_Regno] = {
              facultyName: qp.QP_Faculty_assigned,
              regNo: qp.QP_Faculty_assigned_Regno,
              totalAssigned: 0,
              completed: 0,
              referenceNumbers: []
            };
          }
          
          stats[qp.QP_Faculty_assigned_Regno].totalAssigned++;
          if (qp.QP_Status === "Locked") {
            stats[qp.QP_Faculty_assigned_Regno].completed++;
          }
          if (qp.QP_Ref_no) {
            stats[qp.QP_Faculty_assigned_Regno].referenceNumbers.push(qp.QP_Ref_no);
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
      
      if (column === "QP_Ref_no") {
        return faculty.referenceNumbers.some(refNo => 
          refNo.toString().toLowerCase().includes(filterValue.toLowerCase())
        );
      }
      
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

  const getFormattedTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const timestamp = getFormattedTimestamp();
    const filename = `${timestamp}_faculty_assigned_report`;
    
    doc.text("Faculty Assignment Report", 14, 10);
    
    autoTable(doc, {
      head: [["Faculty RegNo", "Faculty", "Papers Assigned", "Reference Numbers", "Status"]],
      body: filteredFaculty.map(faculty => [
        faculty.regNo,
        faculty.facultyName,
        faculty.totalAssigned,
        faculty.referenceNumbers.join(", "),
        `${faculty.completed}/${faculty.totalAssigned} Completed`
      ]),
      startY: 20
    });
  
    doc.save(filename);
  };

  const handleDownloadExcel = () => {
    const timestamp = getFormattedTimestamp();
    const filename = `${timestamp}_qp_assigned_report.xlsx`;
    
    const worksheet = XLSX.utils.json_to_sheet(
      filteredFaculty.map((faculty) => ({
        "Faculty RegNo": faculty.regNo,
        "Faculty Name": faculty.facultyName,
        "Papers Assigned": faculty.totalAssigned,
        "Reference Numbers": faculty.referenceNumbers.join(", "),
        "Status": `${faculty.completed}/${faculty.totalAssigned} Completed`
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty Assignments");
    XLSX.writeFile(workbook, filename);
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
              <th>{renderFilter("QP_Faculty_assigned_Regno", "Faculty RegNo")}</th>
              <th>{renderFilter("QP_Faculty_assigned", "Faculty")}</th>
              <th>Papers Assigned</th>
              <th>{renderFilter("QP_Ref_no", "Reference Numbers")}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((faculty) => (
              <tr key={faculty.regNo} className={styles.row}>
                <td>{faculty.regNo}</td>
                <td>{faculty.facultyName}</td>
                <td>{faculty.totalAssigned}</td>
                <td>{faculty.referenceNumbers.join(", ")}</td>
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