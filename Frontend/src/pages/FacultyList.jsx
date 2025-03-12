import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
  });
  const [columnOptions, setColumnOptions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/qps");
        const sortedData = response.data.sort((a, b) => {
          // Enhanced sorting logic
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

      // Handle text search for specific columns
      if (
        ["QP_Subject", "QP_Faculty_assigned", "QP_Subjectcode"].includes(column)
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
    const doc = new jsPDF("landscape");
    const title = "Question Paper Report";
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
      new Date(qp.QP_Deadline).toLocaleDateString(),
      qp.QP_Status,
      qp.QP_Type,
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      theme: "grid",
      margin: { top: 20 },
      didDrawPage: (data) => {
        doc.setFontSize(16);
        doc.text(title, 14, 15);
      },
    });

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
        Status: qp.QP_Status,
        Type: qp.QP_Type,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QPs");
    XLSX.writeFile(workbook, "qp-report.xlsx");
  };

  const renderFilter = (column, label) => {
    // Faculty RegNo column without filter
    if (column === "QP_Faculty_assigned_Regno") {
      return (
        <div className={styles.headerContainer}>
          <div className={styles.headerLabel}>{label}</div>
        </div>
      );
    }

    // Text search for Subject, Faculty, and Subject Code columns
    if (
      ["QP_Subject", "QP_Faculty_assigned", "QP_Subjectcode"].includes(column)
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

    // Dropdown filters for other columns
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
              <th>{renderFilter("QP_status", "Status")}</th>
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
                    data-status={qp.QP_Status}
                  >
                    {qp.QP_Status}
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
