import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Ensure autoTable is included
import * as XLSX from "xlsx";
import styles from "../page_styles/FacultyList.module.css";

const QPList = () => {
  const [qps, setQps] = useState([]);
  const [filters, setFilters] = useState({
    QP_Session: "all",
    QP_Degree: "all",
    QP_Regulation: "all",
    QP_Board: "all",
    QP_Semester: "all",
    QP_Subjectcode: "",
    QP_Subject: "",
    QP_Faculty_assigned: "",
    QP_Faculty_assigned_Regno: "",
    QP_Status: "all",
    QP_Type: "all",
    QP_Ref_no: "", // Added Ref No. search filter
  });
  const [columnOptions, setColumnOptions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}api/qps`
        );
        const sortedData = response.data.sort((a, b) => {
          if (a.QP_Session < b.QP_Session) return -1;
          if (a.QP_Session > b.QP_Session) return 1;

          if (a.QP_Regulation < b.QP_Regulation) return -1;
          if (a.QP_Regulation > b.QP_Regulation) return 1;

          if (a.QP_Semester < b.QP_Semester) return -1;
          if (a.QP_Semester > b.QP_Semester) return 1;

          const dateA = new Date(a.QP_Deadline);
          const dateB = new Date(b.QP_Deadline);
          if (dateA < dateB) return -1;
          if (dateA > dateB) return 1;

          return a.QP_Subject.localeCompare(b.QP_Subject);
        });

        setQps(sortedData);

        const options = {
          QP_Session: [
            "all",
            ...new Set(sortedData.map((qp) => qp.QP_Session)),
          ],
          QP_Degree: ["all", ...new Set(sortedData.map((qp) => qp.QP_Degree))],
          QP_Regulation: [
            "all",
            ...new Set(sortedData.map((qp) => qp.QP_Regulation)),
          ],
          QP_Board: ["all", ...new Set(sortedData.map((qp) => qp.QP_Board))],
          QP_Semester: [
            "all",
            ...new Set(sortedData.map((qp) => qp.QP_Semester.toString())),
          ],
          QP_Status: ["all", ...new Set(sortedData.map((qp) => qp.QP_Status))],
          QP_Type: ["all", ...new Set(sortedData.map((qp) => qp.QP_Type))],
        };
        setColumnOptions(options);
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

  const filteredQPs = qps.filter((qp) => {
    return Object.entries(filters).every(([column, filterValue]) => {
      if (filterValue === "all" || filterValue === "") return true;
      const qpValue = qp[column];

      if (
        [
          "QP_Ref_no", // Added Ref No. to text search
          "QP_Subject",
          "QP_Faculty_assigned",
          "QP_Subjectcode",
        ].includes(column)
      ) {
        return qpValue
          .toString()
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      }

      return qpValue.toString().toLowerCase() === filterValue.toLowerCase();
    });
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQPs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDownloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape"); // Set landscape orientation
    const title = "Question Paper Report";

    // Define headers for the table
    const headers = [
      [
        "Ref No.",
        "Session",
        "Degree",
        "Regulation",
        "Board",
        "Semester",
        "Subject Code",
        "Subject",
        "Faculty",
        "Faculty RegNo",
        "Deadline",
        "Status",
        "Type",
      ],
    ];

    // Prepare data for the table
    const data = filteredQPs.map((qp) => [
      qp.QP_Ref_no,
      qp.QP_Session,
      qp.QP_Degree,
      qp.QP_Regulation,
      qp.QP_Board,
      qp.QP_Semester,
      qp.QP_Subjectcode,
      qp.QP_Subject,
      qp.QP_Faculty_assigned,
      qp.QP_Faculty_assigned_Regno,
      qp.QP_Deadline ? new Date(qp.QP_Deadline).toLocaleDateString() : "N/A",
      qp.QP_Status === "Locked" ? "Completed" : "Pending",
      qp.QP_Type,
    ]);

    // Add Title
    doc.setFontSize(16);
    doc.text(title, 14, 10); // Adjusted position

    // Add Table
    doc.autoTable({
      head: headers,
      body: data,
      theme: "grid",
      startY: 20, // Ensure table does not overlap with title
      styles: { fontSize: 8 },
      headStyles: { fillColor: [44, 62, 80] }, // Dark blue header
      alternateRowStyles: { fillColor: [240, 240, 240] }, // Light gray for alternating rows
    });

    // Save the PDF
    doc.save("qp-report.pdf");
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredQPs.map((qp) => ({
        "Ref No.": qp.QP_Ref_no,
        Session: qp.QP_Session,
        Degree: qp.QP_Degree,
        Regulation: qp.QP_Regulation,
        Board: qp.QP_Board,
        Semester: qp.QP_Semester,
        "Subject Code": qp.QP_Subjectcode,
        Subject: qp.QP_Subject,
        Faculty: qp.QP_Faculty_assigned,
        "Faculty RegNo": qp.QP_Faculty_assigned_Regno,
        Deadline: new Date(qp.QP_Deadline).toLocaleDateString(),
        Status: qp.QP_Status === "Locked" ? "Completed" : "Pending", // Updated status mapping
        Type: qp.QP_Type,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QPs");
    XLSX.writeFile(workbook, "qp-report.xlsx");
  };

  const renderFilter = (column, label) => {
    if (column === "QP_Faculty_assigned_Regno") {
      return (
        <div className={styles.headerContainer}>
          <div className={styles.headerLabel}>{label}</div>
        </div>
      );
    }

    if (
      [
        "QP_Ref_no", // Added Ref No. to text search
        "QP_Subject",
        "QP_Faculty_assigned",
        "QP_Subjectcode",
      ].includes(column)
    ) {
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
    }

    const totalPages = Math.ceil(filteredQPs.length / itemsPerPage);

    const generatePageNumbers = () => {
      const current = currentPage;
      const total = totalPages;
      const pages = [];

      if (total <= 5) {
        // Show all pages if total pages is 5 or less
        for (let i = 1; i <= total; i++) pages.push(i);
        return pages;
      }

      if (current <= 3) {
        // First 3 pages + ellipsis + last page
        pages.push(1, 2, 3, "...", total);
      } else if (current >= total - 2) {
        // First page + ellipsis + last 3 pages
        pages.push(1, "...", total - 2, total - 1, total);
      } else {
        // First page + ellipsis + current-1, current, current+1 + ellipsis + last
        pages.push(1, "...", current - 1, current, current + 1, "...", total);
      }

      return pages;
    };

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
            {columnOptions[column]
              ?.filter((opt) => opt !== "all")
              .map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Question Paper Management</h1>
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
              <th>{renderFilter("QP_Session", "Session")}</th>
              <th>{renderFilter("QP_Degree", "Degree")}</th>
              <th>{renderFilter("QP_Regulation", "Regulation")}</th>
              <th>{renderFilter("QP_Board", "Board")}</th>
              <th>{renderFilter("QP_Semester", "Semester")}</th>
              <th>{renderFilter("QP_Subjectcode", "Subject Code")}</th>
              <th>{renderFilter("QP_Subject", "Subject")}</th>
              <th>{renderFilter("QP_Faculty_assigned", "Faculty")}</th>
              <th>
                {renderFilter("QP_Faculty_assigned_Regno", "Faculty RegNo")}
              </th>
              <th>Deadline</th>
              <th>{renderFilter("QP_Type", "Type")}</th>
              <th>{renderFilter("QP_Status", "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((qp) => (
              <tr key={qp.QP_Ref_no} className={styles.row}>
                <td>{qp.QP_Ref_no}</td>
                <td>{qp.QP_Session}</td>
                <td>{qp.QP_Degree}</td>
                <td>{qp.QP_Regulation}</td>
                <td>{qp.QP_Board}</td>
                <td>{qp.QP_Semester}</td>
                <td>{qp.QP_Subjectcode}</td>
                <td>{qp.QP_Subject}</td>
                <td>{qp.QP_Faculty_assigned}</td>
                <td>{qp.QP_Faculty_assigned_Regno}</td>
                <td>{new Date(qp.QP_Deadline).toLocaleDateString()}</td>
                <td>{qp.QP_Type}</td>
                <td>
                  <span
                    className={styles.statusBadge}
                    data-status={
                      qp.QP_Status === "Locked" ? "Completed" : "Pending"
                    }
                  >
                    {qp.QP_Status === "Locked" ? "Completed" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        {Array.from(
          { length: Math.ceil(filteredQPs.length / itemsPerPage) },
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

export default QPList;
