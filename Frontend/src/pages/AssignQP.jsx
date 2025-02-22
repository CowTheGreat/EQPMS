import React, { useState, useEffect } from "react";
import styles from "../page_styles/AssignQP.module.css";

const AssignQP = () => {
  const [formData, setFormData] = useState({
    session: "",
    degree: "",
    regulation: "",
    board: "",
    semester: "",
    subjectCode: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [facultyCount, setFacultyCount] = useState(3);
  const [message, setMessage] = useState("");

  // Fetch subjects when board is selected
  useEffect(() => {
    if (formData.board) {
      fetch(`http://localhost:8080/get-subjects?board=${formData.board}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Subjects API Response:", data);
          setSubjects(Array.isArray(data) ? data : []); // Ensure it's an array
        })
        .catch(() => setSubjects([]));
    }
  }, [formData.board]);

  // Fetch faculty when board is selected
  useEffect(() => {
    if (formData.board) {
      fetch(`http://localhost:8080/get-faculty?board=${formData.board}`)
        .then((res) => res.json())
        .then((data) => setFacultyList(data))
        .catch(() => setFacultyList([]));
    }
  }, [formData.board]);

  // Update subject name when subject code is selected
  useEffect(() => {
    const selectedSubject = subjects.find(
      (sub) => sub.subject_code === formData.subjectCode
    );
    setSubjectName(selectedSubject ? selectedSubject.subject_name : "");
  }, [formData.subjectCode, subjects]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle faculty selection
  const handleFacultySelect = (e) => {
    const selectedRegno = e.target.value;
    if (
      !selectedFaculty.includes(selectedRegno) &&
      selectedFaculty.length < facultyCount
    ) {
      setSelectedFaculty([...selectedFaculty, selectedRegno]);
    }
  };

  // Handle removing a faculty
  const removeFaculty = (regno) => {
    setSelectedFaculty(selectedFaculty.filter((id) => id !== regno));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFaculty.length < facultyCount) {
      setMessage("Please select required number of faculty members.");
      return;
    }

    const qpData = {
      session: formData.session,
      degree: formData.degree,
      regulation: formData.regulation,
      board: formData.board,
      semester: Number(formData.semester),
      subject_code: formData.subjectCode,
      subject_name: subjectName,
      assigned_faculty_regno: selectedFaculty,
    };

    console.log("QP Data to be sent:", JSON.stringify(qpData, null, 2)); // Debugging

    try {
      const response = await fetch("http://localhost:8080/assign-qp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qpData),
      });

      const result = await response.json();
      console.log("Server Response:", result); // Debugging

      if (response.ok) {
        setMessage("QP assigned successfully!");
        setFormData({
          session: "",
          degree: "",
          regulation: "",
          board: "",
          semester: "",
          subjectCode: "",
        });
        setSelectedFaculty([]);
      } else {
        setMessage(result.detail || "Assignment failed.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Server error. Try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Assign Question Paper</h2>
      {message && <p className={styles.message}>{message}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>Session</label>
          <input
            type="month"
            name="session"
            value={formData.session}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Degree</label>
          <select
            name="degree"
            value={formData.degree}
            onChange={handleChange}
            required
          >
            <option value="">Select Degree</option>
            <option value="B.E">B.E</option>
            <option value="B.Tech">B.Tech</option>
            <option value="M.E">M.E</option>
            <option value="Ph.D">Ph.D</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Regulation</label>
          <select
            name="regulation"
            value={formData.regulation}
            onChange={handleChange}
            required
          >
            <option value="">Select Regulation</option>
            <option value="R2022">R2022</option>
            <option value="R2018">R2018</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Board</label>
          <select
            name="board"
            value={formData.board}
            onChange={handleChange}
            required
          >
            <option value="">Select Board</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Semester</label>
          <input
            type="number"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            min="1"
            max="10"
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Subject Code</label>
          <select
            name="subjectCode"
            value={formData.subjectCode}
            onChange={handleChange}
            required
          >
            <option value="">Select Subject Code</option>
            {subjects.map((sub) => (
              <option key={sub.subject_code} value={sub.subject_code}>
                {sub.subject_code}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Subject Name</label>
          <input type="text" value={subjectName} readOnly />
        </div>

        <div className={styles.inputGroup}>
          <label>Faculty Count</label>
          <input
            type="number"
            value={facultyCount}
            min="3"
            max="5"
            onChange={(e) => setFacultyCount(Number(e.target.value))}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Select Faculty</label>
          <select onChange={handleFacultySelect}>
            <option value="">Select Faculty</option>
            {facultyList.map((fac) => (
              <option key={fac.regno} value={fac.regno}>
                {fac.name} ({fac.regno})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectedFaculty}>
          <p>Selected Faculty:</p>
          {selectedFaculty.map((regno) => (
            <div key={regno} className={styles.facultyTag}>
              {facultyList.find((fac) => fac.regno === regno)?.name} ({regno})
              <button type="button" onClick={() => removeFaculty(regno)}>
                X
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className={styles.button}>
          Assign QP
        </button>
      </form>
    </div>
  );
};

export default AssignQP;
