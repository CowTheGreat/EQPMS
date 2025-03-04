import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import styles from '../page_styles/FacultyList.module.css';

const QPList = () => {
  const [qps, setQps] = useState([]);
  const [boards, setBoards] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/qps');
        setQps(response.data);

        const uniqueBoards = [...new Set(response.data.map(qp => qp.QP_Board))];
        const uniqueStatuses = [...new Set(response.data.map(qp => qp.QP_Status))];
        
        setBoards(uniqueBoards);
        setStatuses(uniqueStatuses);
      } catch (error) {
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
      }
    };
    fetchData();
  }, []);

  const filteredQPs = qps.filter(qp => {
    const boardMatch = selectedBoard === 'all' || qp.QP_Board === selectedBoard;
    const statusMatch = selectedStatus === 'all' || qp.QP_Status === selectedStatus;
    return boardMatch && statusMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQPs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const title = 'Question Paper Report';
    const headers = [['Ref No.', 'Session', 'Degree', 'Regulation', 'Board', 'Semester', 'Subject', 'Status']];
    
    const data = filteredQPs.map(qp => [
      qp.QP_Ref_no,
      qp.QP_Session,
      qp.QP_Degree,
      qp.QP_Regulation,
      qp.QP_Board,
      qp.QP_Semester,
      qp.QP_Subject,
      qp.QP_Status
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      theme: 'grid',
      margin: { top: 30 },
      didDrawPage: (data) => {
        doc.setFontSize(18);
        doc.text(title, 14, 22);
      }
    });

    doc.save('qp-report.pdf');
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredQPs.map(qp => ({
      "Ref No.": qp.QP_Ref_no,
      "Session": qp.QP_Session,
      "Degree": qp.QP_Degree,
      "Regulation": qp.QP_Regulation,
      "Board": qp.QP_Board,
      "Semester": qp.QP_Semester,
      "Subject": qp.QP_Subject,
      "Status": qp.QP_Status
    })));
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QPs");
    XLSX.writeFile(workbook, 'qp-report.xlsx');
  };

  return (
    <div className={styles.container}>
    <div className={styles.header}>
      <h1 className={styles.title}>Question Paper Management</h1>
      
      <div className={styles.downloadButtons}>
        <button className={styles.downloadButton} onClick={handleDownloadPDF}>
          Download as PDF
        </button>
        <button className={styles.downloadButton} onClick={handleDownloadExcel}>
          Download as Excel
        </button>
      </div>
    </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.serial}>Ref No.</th>
              <th>Session</th>
              <th>Degree</th>
              <th>Regulation</th>
              <th>
                <div className={styles.headerFilter}>
                  <span>Board</span>
                  <select
                    value={selectedBoard}
                    onChange={(e) => setSelectedBoard(e.target.value)}
                    className={styles.headerSelect}
                  >
                    <option value="all">All</option>
                    {boards.map(board => (
                      <option key={board} value={board}>{board}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th>Semester</th>
              <th>Subject</th>
              <th>
                <div className={styles.headerFilter}>
                  <span>Status</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={styles.headerSelect}
                  >
                    <option value="all">All</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((qp, index) => (
              <tr key={qp.QP_Ref_no} className={styles.row}>
                <td className={styles.serial}>{qp.QP_Ref_no}</td>
                <td>{qp.QP_Session}</td>
                <td>{qp.QP_Degree}</td>
                <td>{qp.QP_Regulation}</td>
                <td className={styles.dept}>{qp.QP_Board}</td>
                <td>{qp.QP_Semester}</td>
                <td className={styles.subject}>{qp.QP_Subject}</td>
                <td>
                  <span className={styles.statusBadge} data-status={qp.QP_Status}>
                    {qp.QP_Status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        {Array.from({ length: Math.ceil(filteredQPs.length / itemsPerPage) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={`${styles.pageButton} ${currentPage === i + 1 ? styles.active : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QPList;