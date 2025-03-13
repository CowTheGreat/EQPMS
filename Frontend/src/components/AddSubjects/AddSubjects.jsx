import { useState } from "react";
import axios from "axios";
import styles from "./AddSubjects.module.css"; // Import CSS Module

export default function AddSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    degree: "",
    regulation: "",
    board_name: "",
    subject_code: "",
    subject_name: "",
    semester: "",
    qp_type: "T", // Default value for QP Type
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSubject = () => {
    if (
      !formData.degree ||
      !formData.regulation ||
      !formData.board_name ||
      !formData.subject_code ||
      !formData.subject_name ||
      !formData.semester ||
      !formData.qp_type
    ) {
      setMessage("Please fill all fields!");
      return;
    }

    setSubjects([...subjects, formData]);
    setFormData({
      degree: "",
      regulation: "",
      board_name: "",
      subject_code: "",
      subject_name: "",
      semester: "",
      qp_type: "T",
    });
    setMessage("");
  };

  const deleteSubject = (index) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };

  const submitSubjects = async () => {
    if (subjects.length === 0) {
      setMessage("No subjects to submit!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/add-subjects",
        subjects
      );
      setMessage(response.data.message);
      setSubjects([]);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Error submitting subjects");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Add Subjects</h2>

      <div className={styles.formGrid}>
        <input
          type="text"
          name="degree"
          placeholder="Degree (e.g., B.E)"
          value={formData.degree}
          onChange={handleChange}
          className={styles.input}
        />
        <input
          type="text"
          name="regulation"
          placeholder="Regulation (e.g., R2022)"
          value={formData.regulation}
          onChange={handleChange}
          className={styles.input}
        />
        <input
          type="text"
          name="board_name"
          placeholder="Board Name (e.g., CSE)"
          value={formData.board_name}
          onChange={handleChange}
          className={styles.input}
        />
        <input
          type="text"
          name="subject_code"
          placeholder="Subject Code (e.g., CS22601)"
          value={formData.subject_code}
          onChange={handleChange}
          className={styles.input}
        />
        <input
          type="text"
          name="subject_name"
          placeholder="Subject Name (e.g., Cryptography)"
          value={formData.subject_name}
          onChange={handleChange}
          className={styles.input}
        />
        <input
          type="number"
          name="semester"
          placeholder="Semester (e.g., 5)"
          value={formData.semester}
          onChange={handleChange}
          className={styles.input}
        />
        <select
          name="qp_type"
          value={formData.qp_type}
          onChange={handleChange}
          className={styles.input}
        >
          <option value="T">T</option>
          <option value="TNP">TNP</option>
        </select>
      </div>

      <button onClick={addSubject} className={styles.addButton}>
        Add Subject
      </button>

      {subjects.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Degree</th>
              <th>Regulation</th>
              <th>Board</th>
              <th>Code</th>
              <th>Name</th>
              <th>Semester</th>
              <th>QP Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, index) => (
              <tr key={index}>
                <td>{sub.degree}</td>
                <td>{sub.regulation}</td>
                <td>{sub.board_name}</td>
                <td>{sub.subject_code}</td>
                <td>{sub.subject_name}</td>
                <td>{sub.semester}</td>
                <td>{sub.qp_type}</td>
                <td>
                  <button
                    onClick={() => deleteSubject(index)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={submitSubjects} className={styles.submitButton}>
        Submit Subjects
      </button>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
