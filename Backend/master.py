from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import jwt
from datetime import datetime, timedelta
import uvicorn
from pydantic.networks import EmailStr
import uuid
from datetime import datetime
from typing import List

# FastAPI instance
app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust based on frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT secret key
SECRET_KEY = "CowTheGreat"
ALGORITHM = "HS256"

# MySQL Connection
db_config = {
    "user": "root",
    "password": "CowTheGreat",
    "host": "localhost",
    "database": "eqpms",
}

# Pydantic model for login request
class LoginRequest(BaseModel):
    id: str
    password: str

# Pydantic model for password update
class PasswordUpdateRequest(BaseModel):
    id: str
    new_password: str

def get_db_connection():
    return mysql.connector.connect(**db_config)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/login")
def login(user: LoginRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Query user by ID and password
        cursor.execute("SELECT regno, role, password_changed FROM users WHERE regno = %s AND pwd = %s", (user.id, user.password))
        db_user = cursor.fetchone()

        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Ensure password_changed is treated as an integer
        password_changed = int(db_user["password_changed"])

        if password_changed == 0:
            return {"force_password_change": True}

        # Generate JWT Token
        token = create_access_token({"id": db_user["regno"], "role": db_user["role"]})

        return {"token": token, "role": db_user["role"], "force_password_change": False}

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cursor.close()
        conn.close()

@app.post("/update-password")
def update_password(data: PasswordUpdateRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update password and set password_changed to 1
        cursor.execute("UPDATE users SET pwd = %s, password_changed = 1 WHERE regno = %s", (data.new_password, data.id))
        conn.commit()

        return {"message": "Password updated successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        cursor.close()
        conn.close()

class AddUserRequest(BaseModel):
    name: str
    regno: str
    mail: EmailStr
    password: str
    board: str
    role: str  # 'user' or 'admin'

@app.post("/add-user")
def add_user(user: AddUserRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Validate board and role fields
        valid_boards = {"CSE", "ECE", "EEE"}
        valid_roles = {"user", "admin"}
        
        if user.board not in valid_boards:
            raise HTTPException(status_code=400, detail="Invalid board selection")
        if user.role not in valid_roles:
            raise HTTPException(status_code=400, detail="Invalid role selection")

        # Check if user already exists
        cursor.execute("SELECT regno FROM users WHERE regno = %s", (user.regno,))
        existing_user = cursor.fetchone()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")

        # Insert new user into the database
        cursor.execute(
            "INSERT INTO users (name, regno, mail, pwd, board, role, password_changed) VALUES (%s, %s, %s, %s, %s, %s, 0)",
            (user.name, user.regno, user.mail, user.password, user.board, user.role)
        )
        conn.commit()

        return {"message": "User added successfully!"}
    
    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Database error: {db_err}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
    
    finally:
        cursor.close()
        conn.close()

@app.delete("/delete-user/{regno}")
def delete_user(regno: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE regno = %s", (regno,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Delete user
        cursor.execute("DELETE FROM users WHERE regno = %s", (regno,))
        conn.commit()

        return {"message": "User deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error deleting user")
    
    finally:
        cursor.close()
        conn.close()


@app.get("/get-regulations")
def get_regulations(degree: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT DISTINCT regulation FROM boards WHERE degree = %s", (degree,))
        regulations = cursor.fetchall()

        return regulations
    
    except Exception as e:
        print(f"Error in get-regulations: {e}")
        raise HTTPException(status_code=500, detail="Error fetching regulations")

    finally:
        cursor.close()
        conn.close()

@app.get("/get-boards")
def get_boards(degree: str, regulation: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT DISTINCT board_name FROM boards WHERE degree = %s AND regulation = %s",
            (degree, regulation),
        )
        boards = cursor.fetchall()

        return boards

    except Exception as e:
        print(f"Error in get-boards: {e}")
        raise HTTPException(status_code=500, detail="Error fetching boards")

    finally:
        cursor.close()
        conn.close()

@app.get("/get-subjects")
def get_subjects(degree: str, regulation: str, board: str, semester: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT subject_code, subject_name FROM boards WHERE degree = %s AND regulation = %s AND board_name = %s AND semester = %s",
            (degree, regulation, board, semester),
        )
        subjects = cursor.fetchall()

        return subjects

    except Exception as e:
        print(f"Error in get-subjects: {e}")
        raise HTTPException(status_code=500, detail="Error fetching subjects")

    finally:
        cursor.close()
        conn.close()

@app.delete("/delete-subject/{subject_code}")
def delete_subject(subject_code: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM boards WHERE subject_code = %s", (subject_code,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Subject not found")
        return {"message": "Subject deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.get("/get-faculty")
def get_faculty(board: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch faculty sorted by name in ascending order
        cursor.execute("SELECT regno, name FROM users WHERE board = %s ORDER BY name ASC", (board,))
        faculty = cursor.fetchall()
        
        return faculty
    
    except Exception:
        raise HTTPException(status_code=500, detail="Error fetching faculty members")
    
    finally:
        cursor.close()
        conn.close()

class AssignQPRequest(BaseModel):
    session: str
    degree: str
    regulation: str
    board: str
    semester: int
    subject_code: str
    subject_name: str
    assigned_faculty_regno: list[str] 
    deadline: datetime

@app.post("/assign-qp")
def assign_qp(data: AssignQPRequest):
    print("Received Data:", data.dict())
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        for regno in data.assigned_faculty_regno:
            # Generate a unique QP_Ref_no for each faculty entry
            qp_ref_no = f"QP-{uuid.uuid4().hex[:8]}"  # Ensure uniqueness for each row
            
            # Fetch faculty name from users table
            cursor.execute("SELECT name FROM users WHERE regno = %s", (regno,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail=f"Faculty with regno {regno} not found")
            faculty_name = result[0]

            # Insert a separate row for each faculty member, including deadline
            cursor.execute(
                """
                INSERT INTO QP (QP_Ref_no, QP_Session, QP_Degree, QP_Regulation, QP_Board, 
                                QP_Semester, QP_Subjectcode, QP_Subject, 
                                QP_Faculty_assigned, QP_Faculty_assigned_Regno, QP_Deadline)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    qp_ref_no,
                    data.session,
                    data.degree,
                    data.regulation,
                    data.board,
                    data.semester,
                    data.subject_code,
                    data.subject_name,
                    faculty_name,
                    regno,
                    data.deadline  # Store the deadline in the database
                )
            )

        conn.commit()
        return {"message": "QP assigned successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assigning QP: {str(e)}")

    finally:
        cursor.close()
        conn.close()

# Pydantic Model for Subject
class Subject(BaseModel):
    degree: str
    regulation: str
    board_name: str
    subject_code: str
    subject_name: str
    semester: int
    qp_type: str  # New field for QP Type

@app.post("/add-subjects")
def add_subjects(subjects: List[Subject]):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        for subject in subjects:
            try:
                cursor.execute(
                    """
                    INSERT INTO boards (degree, regulation, board_name, subject_code, subject_name, semester, qp_type)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (subject.degree, subject.regulation, subject.board_name, subject.subject_code, subject.subject_name, subject.semester, subject.qp_type)
                )
            except mysql.connector.IntegrityError:
                raise HTTPException(status_code=400, detail=f"Subject {subject.subject_code} already exists")

        conn.commit()
        return {"message": "Subjects added successfully!"}

    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Database error: {db_err}")

    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    uvicorn.run("master:app", host="0.0.0.0", port=8080, reload=True)