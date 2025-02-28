import React, { useState, useEffect } from "react";
import styles from "../page_styles/AssignQP.module.css";

const AssignQP = () => {
  const [formData, setFormData] = useState({
    degree: "",
    regulation: "",
    board: "",
    semester: "",
    subjectCode: "",
  });

  const [deadline, setDeadline] = useState("");
  const [regulations, setRegulations] = useState([]);
  const [boards, setBoards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [facultyCount, setFacultyCount] = useState(1);
  const [message, setMessage] = useState("");

  // Handle deadline change
  const handleDeadlineChange = (e) => {
    setDeadline(e.target.value);
  };

  useEffect(() => {
    if (formData.degree) {
      fetch(`http://localhost:8080/get-regulations?degree=${formData.degree}`)
        .then((res) => res.json())
        .then((data) => setRegulations(data))
        .catch(() => setRegulations([]));
    }
  }, [formData.degree]);

  useEffect(() => {
    if (formData.degree && formData.regulation) {
      fetch(
        `http://localhost:8080/get-boards?degree=${formData.degree}&regulation=${formData.regulation}`
      )
        .then((res) => res.json())
        .then((data) => setBoards(data))
        .catch(() => setBoards([]));
    }
  }, [formData.degree, formData.regulation]);

  // Fetch subjects when board is selected
  // Fetch subjects when degree, regulation, board, or semester changes
  useEffect(() => {
    if (
      formData.degree &&
      formData.regulation &&
      formData.board &&
      formData.semester
    ) {
      fetch(
        `http://localhost:8080/get-subjects?degree=${formData.degree}&regulation=${formData.regulation}&board=${formData.board}&semester=${formData.semester}`
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("Subjects API Response:", data);
          setSubjects(Array.isArray(data) ? data : []); // Ensure it's an array
        })
        .catch((error) => {
          console.error("Error fetching subjects:", error);
          setSubjects([]); // Handle errors without breaking UI
        });
    } else {
      setSubjects([]); // Reset subjects when filters are incomplete
    }
  }, [formData.degree, formData.regulation, formData.board, formData.semester]);

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
  const handleFacultySelect = (e, regno) => {
    if (e.target.checked) {
      if (selectedFaculty.length < facultyCount) {
        setSelectedFaculty([...selectedFaculty, regno]);
      } else {
        e.target.checked = false; // Prevent selecting more than the allowed count
      }
    } else {
      setSelectedFaculty(selectedFaculty.filter((id) => id !== regno));
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
      deadline: deadline, // Include deadline in the data
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
        <div className={styles.inputGroupRow}>
          {/* <div className={styles.inputGroup}>
            <label>Session</label>
            <input
              type="month"
              name="session"
              value={formData.session}
              onChange={handleChange}
              required
            />
          </div> */}
          <div className={styles.inputGroup}>
            <label>Session</label>
            <input
              type="text"
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
              {regulations.map((reg) => (
                <option key={reg.regulation} value={reg.regulation}>
                  {reg.regulation}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.inputGroupRow}>
          <div className={styles.inputGroup}>
            <label>Board</label>
            <select
              name="board"
              value={formData.board}
              onChange={handleChange}
              required
            >
              <option value="">Select Board</option>
              {boards.map((brd) => (
                <option key={brd.board_name} value={brd.board_name}>
                  {brd.board_name}
                </option>
              ))}
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
              disabled={subjects.length === 0} // Disable if no subjects are available
            >
              <option value="">
                {subjects.length === 0
                  ? "No subjects available"
                  : "Select Subject Code"}
              </option>
              {subjects.map((sub) => (
                <option key={sub.subject_code} value={sub.subject_code}>
                  {sub.subject_code}
                </option>
              ))}
            </select>
          </div>

          {/* <div className={styles.inputGroup}>
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
          </div> */}
        </div>

        <div className={styles.inputGroupRow}>
          <div className={styles.inputGroup}>
            <label>Subject Name</label>
            <input type="text" value={subjectName} readOnly />
          </div>
          <div className={styles.inputGroup}>
            <label>Faculty Count</label>
            <input
              type="number"
              value={facultyCount}
              min="1"
              max="3"
              onChange={(e) => setFacultyCount(Number(e.target.value))}
              required
            />
          </div>
          <div className={styles.inputGroupRow}>
            <div className={styles.inputGroup}>
              <label>Deadline</label>
              <input
                type="date"
                name="deadline"
                value={deadline}
                onChange={handleDeadlineChange}
                required
              />
            </div>
          </div>
        </div>

        <div className={styles.inputGroupRow}>
          <div className={styles.inputGroup}>
            <label>Select Faculty</label>
            <div className={styles.facultyChecklist}>
              {facultyList.map((fac) => (
                <div key={fac.regno} className={styles.facultyItem}>
                  <input
                    type="checkbox"
                    id={`faculty-${fac.regno}`}
                    value={fac.regno}
                    checked={selectedFaculty.includes(fac.regno)}
                    onChange={(e) => handleFacultySelect(e, fac.regno)}
                  />
                  <label htmlFor={`faculty-${fac.regno}`}>
                    {fac.name} ({fac.regno})
                  </label>
                </div>
              ))}
            </div>
          </div>
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
