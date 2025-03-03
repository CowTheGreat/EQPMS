import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../page_styles/DeleteSubjects.module.css";

export default function DeleteSubjects() {
  const [formData, setFormData] = useState({
    degree: "",
    regulation: "",
    board_name: "",
    semester: "",
  });

  const [regulations, setRegulations] = useState([]);
  const [boards, setBoards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (formData.degree) fetchRegulations();
  }, [formData.degree]);

  useEffect(() => {
    if (formData.degree && formData.regulation) fetchBoards();
  }, [formData.degree, formData.regulation]);

  useEffect(() => {
    if (
      formData.degree &&
      formData.regulation &&
      formData.board_name &&
      formData.semester
    ) {
      fetchSubjects();
    }
  }, [
    formData.degree,
    formData.regulation,
    formData.board_name,
    formData.semester,
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSubjects([]); // Reset subjects when filters change
  };

  const fetchRegulations = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/get-regulations?degree=${formData.degree}`
      );
      setRegulations(response.data);
    } catch (error) {
      console.error("Error fetching regulations:", error);
    }
  };

  const fetchBoards = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/get-boards?degree=${formData.degree}&regulation=${formData.regulation}`
      );
      setBoards(response.data);
    } catch (error) {
      console.error("Error fetching boards:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/get-subjects?degree=${formData.degree}&regulation=${formData.regulation}&board=${formData.board_name}&semester=${formData.semester}`
      );
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const deleteSubject = async (subject_code) => {
    try {
      console.log(`Deleting subject: ${subject_code}`);
      const response = await axios.delete(
        `http://localhost:8080/delete-subject/${subject_code}`
      );
      console.log("Response:", response.data);

      setSubjects(subjects.filter((sub) => sub.subject_code !== subject_code));
      setMessage("Subject deleted successfully.");
    } catch (error) {
      console.error("Error:", error);
      setMessage(error.response?.data?.detail || "Error deleting subject");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Delete Subject</h2>

      <div className={styles.formGrid}>
        <select
          name="degree"
          value={formData.degree}
          onChange={handleChange}
          className={styles.input}
        >
          <option value="">Select Degree</option>
          <option value="B.E">B.E</option>
          <option value="B.Tech">B.Tech</option>
          <option value="M.E">M.E</option>
          <option value="Ph.D">Ph.D</option>
        </select>

        <select
          name="regulation"
          value={formData.regulation}
          onChange={handleChange}
          className={styles.input}
        >
          <option value="">Select Regulation</option>
          {regulations.map((reg) => (
            <option key={reg.regulation} value={reg.regulation}>
              {reg.regulation}
            </option>
          ))}
        </select>

        <select
          name="board_name"
          value={formData.board_name}
          onChange={handleChange}
          className={styles.input}
        >
          <option value="">Select Board</option>
          {boards.map((brd) => (
            <option key={brd.board_name} value={brd.board_name}>
              {brd.board_name}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="semester"
          placeholder="Semester"
          value={formData.semester}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      {subjects.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub) => (
              <tr key={sub.subject_code}>
                <td>{sub.subject_code}</td>
                <td>{sub.subject_name}</td>
                <td>
                  <button
                    onClick={() => deleteSubject(sub.subject_code)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.message}>No subjects found.</p>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
