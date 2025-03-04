import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styles from '../page_styles/Admin2.module.css';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import FacultyList from './FacultyList';  // Add this import


ChartJS.register(ArcElement, Tooltip, Legend);

const Admin2 = () => {
  const [boards, setBoards] = useState([]);
  const [qps, setQps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boardsRes, qpsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/boards'),
          axios.get('http://localhost:8000/api/qps'),
        ]);
        setBoards(boardsRes.data);
        setQps(qpsRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusCounts = qps.reduce((acc, qp) => {
    acc[qp.QP_Status] = (acc[qp.QP_Status] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: [
        '#16a085',
        '#f1c40f',
        '#e74c3c',
        '#3498db',
        '#9b59b6'
      ],
      hoverOffset: 4
    }]
  };

  const filteredBoards = boards.filter(board => 
    board.board_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentBoards = filteredBoards.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredBoards.length / rowsPerPage);

  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Question Paper Management Dashboard</h1>

      <div className={styles.topSection}>
        <section className={styles.boardsSection}>
          <h2>Subject Boards</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <div className={styles.filterHeader}>
                    <span>Board</span>
                    <div className={styles.filterContainer}>
                      <input
                        type="text"
                        placeholder="Filter boards..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className={styles.filterInput}
                      />
                      <Filter size={16} className={styles.filterIcon} />
                    </div>
                  </div>
                </th>
                <th>Subject Code</th>
                <th>Subject Name</th>
              </tr>
            </thead>
            <tbody>
              {currentBoards.map(board => (
                <tr key={board.id}>
                  <td>{board.board_name}</td>
                  <td>{board.subject_code}</td>
                  <td>{board.subject_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className={styles.pagination}>
            <button 
              onClick={prevPage} 
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              <ChevronLeft size={18} />
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              onClick={nextPage} 
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <section className={styles.chartSection}>
          <h2>QP Status Distribution</h2>
          <div className={styles.chartContainer}>
            <Pie 
              data={chartData} 
              options={{ 
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </section>
      </div>
      <section className={styles.section}>
      <FacultyList />
    </section>
    </div>
  );
};

export default Admin2;