from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import jwt
from datetime import datetime, timedelta
import uvicorn
from pydantic.networks import EmailStr
from datetime import datetime
from typing import List

#Gowtham
from fastapi.responses import Response
from reportlab.pdfgen import canvas
from fastapi.responses import FileResponse
from fastapi import APIRouter, BackgroundTasks, Depends
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import mysql.connector
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
import os
import io

from fastapi.staticfiles import StaticFiles

import socket
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import Response
from reportlab.pdfgen import canvas
from pydantic import BaseModel

#Akeel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import platform
from fastapi import BackgroundTasks
from fastapi import HTTPException
from fastapi.responses import FileResponse
import zipfile
import io
from urllib.parse import unquote
from fastapi.responses import StreamingResponse


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

#URL
BASE_URL = "http://localhost:8080"

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

# Configure logging
LOG_DIR = "../Frontend/public"
LOG_FILE = os.path.join(LOG_DIR, "logs.txt")
os.makedirs(LOG_DIR, exist_ok=True)

def log_text(message: str = ""):
    """Logs endpoint access with custom message"""
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"{timestamp} | Message: {message} \n"

        with open(LOG_FILE, "a") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"Logging failed: {str(e)}")

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

        # Log successful login
        log_text(
            message=f"User {user.id} logged in"
        )

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
    employee_type: str  # 'Internal' or 'External'

@app.post("/add-user")
def add_user(user: AddUserRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Validate board and role fields
        valid_boards = {"CSE", "ECE", "EEE"}
        valid_roles = {"user", "admin"}
        valid_employee_types = {"Internal", "External"}

        if user.board not in valid_boards:
            raise HTTPException(status_code=400, detail="Invalid board selection")
        if user.role not in valid_roles:
            raise HTTPException(status_code=400, detail="Invalid role selection")
        if user.employee_type not in valid_employee_types:
            raise HTTPException(status_code=400, detail="Invalid employee type selection")

        # Check if user already exists
        cursor.execute("SELECT regno FROM users WHERE regno = %s", (user.regno,))
        existing_user = cursor.fetchone()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")

        # Insert new user into the database
        cursor.execute(
            "INSERT INTO users (name, regno, mail, pwd, board, role, password_changed, employee_type) VALUES (%s, %s, %s, %s, %s, %s, 0, %s)",
            (user.name, user.regno, user.mail, user.password, user.board, user.role, user.employee_type)
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

# Backend Endpoint (FastAPI)
@app.put("/update-user/{regno}")
def update_user(regno: str, user_data: dict):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Validate existing user
        cursor.execute("SELECT * FROM users WHERE regno = %s", (regno,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Validate input fields
        valid_boards = {"CSE", "ECE", "EEE"}
        valid_roles = {"user", "admin"}
        valid_employee_types = {"Internal", "External"}

        if 'board' in user_data and user_data['board'] not in valid_boards:
            raise HTTPException(status_code=400, detail="Invalid board selection")
        if 'role' in user_data and user_data['role'] not in valid_roles:
            raise HTTPException(status_code=400, detail="Invalid role selection")
        if 'employee_type' in user_data and user_data['employee_type'] not in valid_employee_types:
            raise HTTPException(status_code=400, detail="Invalid employee type selection")

        # Build update query dynamically
        update_fields = []
        params = []
        
        for field in ['name', 'mail', 'board', 'role', 'employee_type']:
            if field in user_data:
                update_fields.append(f"{field} = %s")
                params.append(user_data[field])
        
        # Handle password update separately
        if 'password' in user_data:
            update_fields.append("pwd = %s")
            params.append(user_data['password'])
            update_fields.append("password_changed = 0")
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Add regno for WHERE clause
        params.append(regno)
        
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE regno = %s"
        cursor.execute(query, tuple(params))
        conn.commit()

        return {"message": "User updated successfully"}
    
    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Database error: {db_err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/get-regulations")
def get_regulations(degree: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT DISTINCT regulation FROM subjects WHERE degree = %s", (degree,))
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
            "SELECT DISTINCT board_name FROM subjects WHERE degree = %s AND regulation = %s",
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
            "SELECT subject_code, subject_name, QP_Type FROM subjects WHERE degree = %s AND regulation = %s AND board_name = %s AND semester = %s",
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

@app.get("/get-subjects-pc")
def get_subjects_pc(degree: str, regulation: str, board: str, semester: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT subject_code, subject_name, QP_Type FROM subjects WHERE degree = %s AND regulation = %s AND board_name = %s AND semester = %s AND elective_type = 'PC'",
            (degree, regulation, board, semester),
        )
        subjects = cursor.fetchall()

        return subjects

    except Exception as e:
        print(f"Error in get-subjects-pc: {e}")
        raise HTTPException(status_code=500, detail="Error fetching PC subjects")

    finally:
        cursor.close()
        conn.close()

@app.get("/get-subjects-oe")
def get_subjects_oe(degree: str, regulation: str, board: str, semester: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT subject_code, subject_name, QP_Type FROM subjects WHERE degree = %s AND regulation = %s AND board_name = %s AND elective_type = 'OE'",
            (degree, regulation, board),
        )
        subjects = cursor.fetchall()

        return subjects

    except Exception as e:
        print(f"Error in get-subjects-oe: {e}")
        raise HTTPException(status_code=500, detail="Error fetching OE subjects")

    finally:
        cursor.close()
        conn.close()

@app.get("/get-subjects-se")
def get_subjects_se(degree: str, regulation: str, board: str, semester: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT subject_code, subject_name, QP_Type FROM subjects WHERE degree = %s AND regulation = %s AND board_name = %s AND elective_type = 'SE'",
            (degree, regulation, board),
        )
        subjects = cursor.fetchall()

        return subjects

    except Exception as e:
        print(f"Error in get-subjects-se: {e}")
        raise HTTPException(status_code=500, detail="Error fetching SE subjects")

    finally:
        cursor.close()
        conn.close()

@app.get("/get-subjects-pe")
def get_subjects_pe(degree: str, regulation: str, board: str, semester: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT subject_code, subject_name, QP_Type FROM subjects WHERE degree = %s AND regulation = %s AND board_name = %s  AND elective_type = 'PE'",
            (degree, regulation, board),
        )
        subjects = cursor.fetchall()

        return subjects

    except Exception as e:
        print(f"Error in get-subjects-pe: {e}")
        raise HTTPException(status_code=500, detail="Error fetching PE subjects")

    finally:
        cursor.close()
        conn.close()

@app.delete("/delete-subject/{subject_code}")
def delete_subject(subject_code: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM subjects WHERE subject_code = %s", (subject_code,))
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

@app.get("/get-faculty-noblack")
def get_faculty_noblack(board: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch faculty sorted by name in ascending order, excluding blacklisted ones
        cursor.execute("SELECT regno, name FROM users WHERE board = %s AND black_listed = 0 ORDER BY name ASC", (board,))
        faculty = cursor.fetchall()
        
        return faculty
    
    except Exception:
        raise HTTPException(status_code=500, detail="Error fetching faculty members")
    
    finally:
        cursor.close()
        conn.close()

@app.patch("/blacklist-user/{regno}")
def blacklist_user(regno: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE users SET black_listed = 1 WHERE regno = %s", (regno,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "User blacklisted successfully"}

    except Exception:
        raise HTTPException(status_code=500, detail="Error blacklisting user")

    finally:
        cursor.close()
        conn.close()

@app.get("/get-blacklisted-faculty")
def get_blacklisted_faculty():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT regno, name, board FROM users WHERE black_listed = 1 ORDER BY name ASC")
        faculty = cursor.fetchall()
        
        return faculty

    except Exception:
        raise HTTPException(status_code=500, detail="Error fetching blacklisted faculty members")
    
    finally:
        cursor.close()
        conn.close()


@app.patch("/unblacklist-user/{regno}")
def unblacklist_user(regno: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE users SET black_listed = 0 WHERE regno = %s", (regno,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "User unblacklisted successfully"}

    except Exception:
        raise HTTPException(status_code=500, detail="Error unblacklisting user")

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
    subject_type: str  # ✅ Include QP_Type
    assigned_faculty_regno: list[str]
    deadline: datetime

# SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "cletocite@gmail.com"  # Your email
SMTP_PASS = "ivpewaafeehsslfn"  # Your app password


def send_email(recipient, subject, body):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = recipient
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, recipient, msg.as_string())

@app.post("/assign-qp")
def assign_qp(data: AssignQPRequest, background_tasks: BackgroundTasks):
    print("Received Data:", data.dict())  # ✅ Debugging

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        current_year = datetime.now().year
        # year_code = (current_year - 1) % 100 if data.semester % 2 == 0 else current_year % 100
        year_code = current_year % 100

        semester_type = "1" if data.semester % 2 != 0 else "2"
        
        degree_type = "1" if data.degree.upper() in ["B.E", "B.TECH"] else "2"
        
        cursor.execute("SELECT employee_type FROM users WHERE regno = %s", (data.assigned_faculty_regno[0],))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail=f"Faculty with regno {data.assigned_faculty_regno[0]} not found")
        faculty_type = result[0]

        qp_type = "1" if faculty_type == "Internal" else "2"

        session_title = f"{str(data.session)}{str(current_year)[-2:]}"

        cursor.execute(
            """
            SELECT MAX(CAST(SUBSTRING(QP_Ref_no, -3) AS UNSIGNED)) FROM QP 
            WHERE QP_Session = %s
            """,
            (session_title,)
        )
        last_serial = cursor.fetchone()[0]
        serial_number = int(last_serial) + 1 if last_serial else 1
        serial_str = f"{serial_number:03}"

        for regno in data.assigned_faculty_regno:
            cursor.execute("SELECT employee_type FROM users WHERE regno = %s", (data.assigned_faculty_regno[0],))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail=f"Faculty with regno {data.assigned_faculty_regno[0]} not found")
            faculty_type = result[0]

            qp_type = "1" if faculty_type == "Internal" else "2"

            session_title = f"{str(data.session)}{str(current_year)[-2:]}"

            cursor.execute(
                """
                SELECT MAX(CAST(SUBSTRING(QP_Ref_no, -3) AS UNSIGNED)) FROM QP 
                WHERE QP_Session = %s
                """,
                (session_title,)
            )
            last_serial = cursor.fetchone()[0]
            serial_number = int(last_serial) + 1 if last_serial else 1
            serial_str = f"{serial_number:03}"
            qp_ref_no = f"{year_code}{semester_type}{degree_type}{qp_type}{serial_str}"

            cursor.execute("SELECT name, mail FROM users WHERE regno = %s", (regno,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail=f"Faculty with regno {regno} not found")
            faculty_name, faculty_mail = result

            cursor.execute(
                """
                INSERT INTO QP (QP_Ref_no, QP_Session, QP_Degree, QP_Regulation, QP_Board, 
                                QP_Semester, QP_Subjectcode, QP_Subject, QP_Type,
                                QP_Faculty_assigned, QP_Faculty_assigned_Regno, QP_Deadline)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    qp_ref_no,
                    session_title,
                    data.degree,
                    data.regulation,
                    data.board,
                    data.semester,
                    data.subject_code,
                    data.subject_name,
                    data.subject_type,  
                    faculty_name,
                    regno,
                    data.deadline
                )
            )

            subject = f"QP Assignment Notification: {data.subject_code}"
            body = f"""
            Hello {faculty_name},
            
            You have been assigned a new Question Paper task.
            
            Subject: {data.subject_name} ({data.subject_code})
            Deadline: {data.deadline}
            QP Reference Number: {qp_ref_no}
            
            Please complete and lock the question paper before the deadline.
            
            Regards,
            Admin
            """
            # background_tasks.add_task(send_email, faculty_mail, subject, body)
            background_tasks.add_task(send_email, "cowara987@gmail.com", subject, body)

        conn.commit()
        return {"message": "QP assigned successfully and notification emails sent!", "QP_Ref_no": qp_ref_no}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assigning QP: {str(e)}")

    finally:
        cursor.close()
        conn.close()

class UpdateDeadlineRequest(BaseModel):
    session: str
    new_deadline: str

@app.post("/update-deadline")
def update_deadline(data: UpdateDeadlineRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        current_year = datetime.now().year % 100  # Get last two digits of the year
        formatted_session = f"{data.session.upper()}{current_year}"

        cursor.execute("SELECT COUNT(*) FROM QP WHERE QP_Session = %s", (formatted_session,))
        if cursor.fetchone()[0] == 0:
            raise HTTPException(status_code=404, detail="No QPs found for the given session")

        cursor.execute("UPDATE QP SET QP_Deadline = %s WHERE QP_Session = %s", (data.new_deadline, data.session))
        conn.commit()

        return {"message": f"QP Deadlines updated successfully for session {data.session}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()

class UnlockPapersRequest(BaseModel):
    session: str

@app.post("/unlock-all-papers")
def unlock_all_papers(data: UnlockPapersRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        current_year = datetime.now().year % 100  # Get last two digits of the year
        formatted_session = f"{data.session.upper()}{current_year}"

        cursor.execute("SELECT COUNT(*) FROM QP WHERE QP_Session = %s", (formatted_session,))
        if cursor.fetchone()[0] == 0:
            raise HTTPException(status_code=404, detail="No QPs found for the given session")

        cursor.execute("UPDATE QP SET QP_Status = 'Assigned' WHERE QP_Session = %s", (formatted_session,))
        conn.commit()

        return {"message": f"QP Status updated to 'Assigned' for session {formatted_session}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()


@app.get("/get-paper-details")
def get_paper_details(refNo: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM QP WHERE QP_Ref_no = %s", (refNo,))
        paper = cursor.fetchone()

        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")

        return paper

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()

class UpdatePaperRequest(BaseModel):
    QP_Ref_no: str
    QP_Session: str
    QP_Degree: str
    QP_Regulation: str
    QP_Board: str
    QP_Semester: int
    QP_Subjectcode: str
    QP_Subject: str
    QP_Faculty_assigned: str
    QP_Faculty_assigned_Regno: str
    QP_Deadline: str
    QP_Status: str
    QP_Type: str

@app.post("/update-paper")
def update_paper(data: UpdatePaperRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        print("Received update request:", data.dict())  # ✅ Debugging
        
        cursor.execute(
            """
            UPDATE QP 
            SET QP_Session = %s, QP_Degree = %s, QP_Regulation = %s, 
                QP_Board = %s, QP_Semester = %s, QP_Subjectcode = %s, 
                QP_Subject = %s, QP_Faculty_assigned = %s, 
                QP_Faculty_assigned_Regno = %s, QP_Deadline = %s, 
                QP_Status = %s, QP_Type = %s
            WHERE QP_Ref_no = %s
            """,
            (
                data.QP_Session, data.QP_Degree, data.QP_Regulation, 
                data.QP_Board, data.QP_Semester, data.QP_Subjectcode, 
                data.QP_Subject, data.QP_Faculty_assigned, 
                data.QP_Faculty_assigned_Regno, data.QP_Deadline, 
                data.QP_Status, data.QP_Type, data.QP_Ref_no
            ),
        )
        print("Query executed successfully!")  # ✅ Debugging
        print("Rows affected:", cursor.rowcount)  # ✅ Debugging

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="No changes were made.")

        conn.commit()
        return {"message": "Paper details updated successfully"}

    except Exception as e:
        print("Error occurred:", str(e))  # ✅ Debugging
        raise HTTPException(status_code=500, detail=str(e))

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
    qp_type: str
    elective_type: str

@app.post("/add-subjects")
def add_subjects(subjects: List[Subject]):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        for subject in subjects:
            try:
                cursor.execute(
                    """
                    INSERT INTO subjects (degree, regulation, board_name, subject_code, subject_name, semester, qp_type, elective_type)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (subject.degree, subject.regulation, subject.board_name, subject.subject_code, subject.subject_name, subject.semester, subject.qp_type, subject.elective_type)
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

#Gowtham
#Gowtham
#Gowtham
#Gowtham
#Gowtham
#Gowtham
#Gowtham

@app.get("/user_data/{faculty_id}")
def get_user_data(faculty_id: str):
    print(faculty_id)

    """Fetch all question papers assigned to a specific faculty member by ID."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT QP_Ref_no, QP_Session, QP_Degree, QP_Regulation, QP_Board, 
               QP_Semester, QP_Subjectcode, QP_Subject, QP_Status, QP_Deadline
        FROM QP WHERE QP_Faculty_assigned_Regno = %s 
    """
    cursor.execute(query, (faculty_id,))
    data = cursor.fetchall()
    conn.close()

    if not data:
        raise HTTPException(status_code=404, detail="No question papers found")

    return {"assignments": data}

# ✅ Update Question Paper Status
@app.put("/update_status/{qp_ref}")
def update_status(qp_ref: str, new_status: str):
    """Updates the status of a question paper."""
    valid_statuses = ["Assigned", "In Progress", "Saved", "Locked"]

    if new_status.replace("+", " ") not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("UPDATE QP SET QP_Status = %s WHERE QP_Ref_no = %s", (new_status.replace("+", " "), qp_ref))
    conn.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Question Paper not found")

    conn.close()
    return {"message": f"Question Paper {qp_ref} status updated to {new_status.replace('+', ' ')}"}

# ✅ File Upload Function (Organized in Proper Hierarchy)
BUFFER_DIR = "buffer_papers"
UPLOAD_DIR = "uploaded_papers"

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), username: str = Form(...), qp_ref: str = Form(...)):
    """Uploads a file and saves it in the buffer folder."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT QP_Session, QP_Degree, QP_Regulation, QP_Board, QP_Semester, QP_Subjectcode, QP_Subject
        FROM qp WHERE QP_Ref_no = %s
    """, (qp_ref,))
    qp_data = cursor.fetchone()
    conn.close()

    if not qp_data:
        raise HTTPException(status_code=404, detail="Question Paper not found.")

    session = qp_data["QP_Session"].replace(" ", "")
    degree = qp_data["QP_Degree"].replace(" ", "")
    regulation = qp_data["QP_Regulation"].replace(" ", "")
    board = qp_data["QP_Board"].replace(" ", "")
    semester = f"Sem{qp_data['QP_Semester']}"
    subject_code = qp_data["QP_Subjectcode"].replace(" ", "")
    subject_name = qp_data["QP_Subject"].replace(" ", "").replace("/", "_")

    folder_path = os.path.join(BUFFER_DIR, session, degree, board, regulation, semester, subject_code)
    os.makedirs(folder_path, exist_ok=True)

    file_name = f"{qp_ref}_{subject_code}_{subject_name}_{username}.docx"
    file_path = os.path.join(folder_path, file_name)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Upload log
    log_text(message=f"QP uploaded with Ref no. {qp_ref} and name {file_name}")

    return {"message": f"File saved to buffer successfully: {file_name}", "file_path": file_path}

@app.post("/lock_and_upload/{qp_ref}")
async def lock_and_upload(qp_ref: str):
    """Moves the file from buffer to main upload directory and updates status."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT QP_Session, QP_Degree, QP_Regulation, QP_Board, QP_Semester, QP_Subjectcode, QP_Subject, QP_Faculty_assigned_Regno
        FROM qp WHERE QP_Ref_no = %s
    """, (qp_ref,))
    qp_data = cursor.fetchone()
    conn.close()

    if not qp_data:
        raise HTTPException(status_code=404, detail="Question Paper not found.")

    session = qp_data["QP_Session"].replace(" ", "")
    degree = qp_data["QP_Degree"].replace(" ", "")
    regulation = qp_data["QP_Regulation"].replace(" ", "")
    board = qp_data["QP_Board"].replace(" ", "")
    semester = f"Sem{qp_data['QP_Semester']}"
    subject_code = qp_data["QP_Subjectcode"].replace(" ", "")
    subject_name = qp_data["QP_Subject"].replace(" ", "").replace("/", "_")
    username = qp_data["QP_Faculty_assigned_Regno"]

    buffer_folder_path = os.path.join(BUFFER_DIR, session, degree, board, regulation, semester, subject_code)
    upload_folder_path = os.path.join(UPLOAD_DIR, session, degree, board, regulation, semester, subject_code)
    os.makedirs(upload_folder_path, exist_ok=True)

    buffer_file_name = f"{qp_ref}_{subject_code}_{subject_name}_{username}.docx"
    buffer_file_path = os.path.join(buffer_folder_path, buffer_file_name)
    upload_file_path = os.path.join(upload_folder_path, buffer_file_name)

    if not os.path.exists(buffer_file_path):
        raise HTTPException(status_code=404, detail="Buffer file not found.")

    # Check if the file already exists in the upload directory
    if os.path.exists(upload_file_path):
        # Delete the existing file in the upload directory
        os.remove(upload_file_path)

    # Move the file from buffer to upload directory
    shutil.move(buffer_file_path, upload_file_path)

    return {"message": f"File moved to upload directory successfully: {buffer_file_name}", "file_path": upload_file_path}

# ✅ API to Fetch Uploaded Files
@app.get("/uploaded_files/{qp_ref}")
def get_uploaded_file(qp_ref: str):
    """Returns the uploaded file path for a given QP reference number."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT QP_Status FROM qp WHERE QP_Ref_no = %s", (qp_ref,))
    status = cursor.fetchone()
    conn.close()
    print("Status:",status)

    if not status:
        raise HTTPException(status_code=404, detail="Question Paper not found.")

    # Determine the directory based on status
    if status["QP_Status"] == "Locked":
        directory = UPLOAD_DIR
    else:
        directory = BUFFER_DIR
        
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.startswith(qp_ref):
                file_path = os.path.join(root, file)
                file_url = f"{BASE_URL}/download/{qp_ref}"
                return {"file_url": file_url}

    raise HTTPException(status_code=404, detail="File not found.")

# ✅ API to Download Uploaded Files
@app.get("/download/{qp_ref}")
def download_file(qp_ref: str):
    """Serves the uploaded file for download."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT QP_Status FROM qp WHERE QP_Ref_no = %s", (qp_ref,))
    status = cursor.fetchone()
    conn.close()
    print("Status:",status)

    if not status:
        raise HTTPException(status_code=404, detail="Question Paper not found.")

    # Determine the directory based on status
    if status["QP_Status"] == "Locked":
        directory = UPLOAD_DIR
    else:
        directory = BUFFER_DIR
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.startswith(qp_ref):
                file_path = os.path.join(root, file)
                return FileResponse(file_path, filename=file, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

    raise HTTPException(status_code=404, detail="File not found.")


@app.get("/download_order/{username}")
def download_order(username: str):
    """Generates and returns an order PDF for assigned question papers without saving it to disk."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)

    c.setFont("Helvetica-Bold", 14)
    c.drawString(150, 780, "UG/PG Degree Examinations DEC 2024")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(170, 760, "Question Paper Assignment Order")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, 730, f"Faculty Name: {username}")
    c.drawString(100, 710, "Dear Sir/Madam,")
    c.drawString(100, 690, "Sub: UG/PG Degree Examinations, DEC 2024 Appointment of Question Paper Setter - Reg")
    
    c.drawString(100, 670, "We are pleased to inform you that you have been appointed as Question Paper Setter for the")
    c.drawString(100, 655, "End Semester Examinations to be held in DEC 2024 under the Autonomous stream of our Institution.")
    c.drawString(100, 640, "We request you to set the following Question Papers (Both Soft and Hard Copy) as per the format:")
    c.drawString(100, 620, "Details for the Question Paper: \"ANSWER KEY NOT REQUIRED\"")
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT QP_Ref_no, QP_Subject, QP_Subjectcode, QP_Degree
        FROM qp WHERE QP_Faculty_assigned_Regno = %s
    """, (username,))
    
    papers = cursor.fetchall()
    conn.close()

    if not papers:
        raise HTTPException(status_code=404, detail="No question papers assigned.")
    
    y_position = 600
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y_position, "S.No  |  Degree  |  Subject Code  |  Title of the Subject  |  Reference Number")
    c.line(100, y_position - 5, 500, y_position - 5)  # Table header underline
    
    c.setFont("Helvetica", 11)
    y_position -= 20
    serial_no = 1
    for paper in papers:
        c.drawString(110, y_position, f"{serial_no}")
        c.drawString(140, y_position, f"{paper['QP_Degree']}")
        c.drawString(200, y_position, f"{paper['QP_Subjectcode']}")
        c.drawString(300, y_position, f"{paper['QP_Subject']}")
        c.drawString(450, y_position, f"{paper['QP_Ref_no']}")
        y_position -= 20  # Move down for next item
        serial_no += 1
    
    c.drawString(50, y_position - 40, "The Question Paper template is available on our website.")
    c.drawString(50, y_position - 55, "The Hard copy of the Question Paper, Checklist/Declaration form & CD should be kept inside")
    c.drawString(50, y_position - 70, "the small cover provided. The question paper should be submitted in person to the Controller of Examinations on or before:")
    c.drawString(50, y_position - 85, "25.11.2024")
    
    c.drawString(50, y_position - 110, "With kind regards,")
    c.drawString(50, y_position - 125, "Mr. V.Krishnamoorthy")
    c.drawString(50, y_position - 140, "Asst. Prof/CSE, SVCE")
    
    # Placeholder signature image
    c.rect(50, y_position - 180, 100, 50, stroke=1, fill=0)  # Placeholder rectangle for signature
    c.drawString(50, y_position - 200, "[Signature]")
    
    c.save()
    buffer.seek(0)
    
    return Response(buffer.read(), media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename={username}_order.pdf"
    })

# SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "cletocite@gmail.com"  # Your email
SMTP_PASS = "ivpewaafeehsslfn"  # Your app password


def send_email(recipient, subject, body):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = recipient
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, recipient, msg.as_string())

# @app.post("/broadcast")
# def broadcast_mail(background_tasks: BackgroundTasks):
#     db = get_db_connection()
#     cursor = db.cursor(dictionary=True)
    
#     query = """
#     SELECT qp.QP_Subjectcode, qp.QP_Subject, qp.QP_Deadline, f.name, f.mail 
#     FROM qp qp 
#     JOIN users f ON qp.QP_Faculty_assigned_Regno = f.regno 
#     WHERE qp.QP_Status != 'Locked'
#     """
    
#     cursor.execute(query)
#     pending_qps = cursor.fetchall()
    
#     for qp in pending_qps:
#         subject = f"Reminder: Pending Question Paper Submission ({qp['QP_Subjectcode']})"
#         body = f"Hello {qp['name']},\n\nYou have not yet locked the question paper for {qp['QP_Subject']}.\nDeadline: {qp['QP_Deadline']}\nPlease complete it at the earliest.\n\nRegards,\nAdmin"
#         background_tasks.add_task(send_email, qp['mail'], subject, body)
#         print("Mail sent to", qp['mail'])
    
#     cursor.close()
#     db.close()
    
#     return {"message": "Broadcast emails scheduled"}

#Akeel
#Akeel
#Akeel
#Akeel
#Akeel
#Akeel
#Akeel
#Akeel

# Pydantic model for Faculty
class FacultySchema(BaseModel):
    name: str
    department: str
    subject: str

# Endpoint to get all QPs from QP_main table
@app.get("/api/qps")
def get_qps():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM QP")  # Changed table name here
        qps = cursor.fetchall()
        return qps
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        connection.close()

# Configure static files
BASE_DIR = Path(__file__).parent
CONTENT_DIR = BASE_DIR / "uploaded_papers"

def validate_path(*path_parts):
    full_path = CONTENT_DIR.joinpath(*path_parts)
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    return full_path

@app.get("/api/sessions/")
async def get_sessions():
    try:
        path = CONTENT_DIR
        if not path.exists():
            return []
        return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/{session}/degrees/")
async def get_degrees(session: str):
    path = validate_path(session)
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{degree}/branches/")
async def get_branches(session: str, degree: str):
    path = validate_path(session, degree)
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{degree}/{branch}/regulations/")
async def get_regulations(session: str, degree: str, branch: str):
    path = validate_path(session, degree, branch)
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{degree}/{branch}/{regulation}/semesters/")
async def get_semesters(session: str, degree: str, branch: str, regulation: str):
    path = validate_path(session, degree, branch, regulation)
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{degree}/{branch}/{regulation}/{semester}/subjects/")
async def get_subjects(session: str, degree: str, branch: str, regulation: str, semester: str):
    path = validate_path(session, degree, branch, regulation, semester)
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{degree}/{branch}/{regulation}/{semester}/{subject}/files/")
async def get_files(session: str, degree: str, branch: str, regulation: str, semester: str, subject: str):
    path = validate_path(session, degree, branch, regulation, semester, subject)
    return [
        {"name": f.name, "url": f"/content/{session}/{degree}/{branch}/{regulation}/{semester}/{subject}/{f.name}"}
        for f in path.iterdir() if f.is_file()
    ]

async def open_explorer(path: Path):
    try:
        system = platform.system()
        if system == "Windows":
            import subprocess
            subprocess.Popen(f'explorer "{path}"')
        elif system == "Darwin":
            os.system(f'open "{path}"')
        else:
            os.system(f'xdg-open "{path}"')
    except Exception as e:
        print(f"Error opening explorer: {str(e)}")

@app.post("/api/reveal-in-explorer/")
async def reveal_in_explorer(
    path_data: dict, 
    background_tasks: BackgroundTasks
):
    try:
        path_segments = path_data['path'].split('/') if path_data['path'] else []
        full_path = CONTENT_DIR
        
        # Always validate the base directory exists
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="Base directory not found")

        # Build path from segments
        for segment in path_segments:
            full_path /= segment
            if not full_path.exists():
                raise HTTPException(status_code=404, detail="Path not found")

        background_tasks.add_task(open_explorer, full_path)
        return {"status": "request_accepted"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{session}/{degree}/{branch}/{regulation}/{semester}/{subject}/{filename}")
async def download_file(
    session: str,
    degree: str,
    branch: str,
    regulation: str,
    semester: str,
    subject: str,
    filename: str
):
    try:
        # Decode URL components
        decoded_path = [
            unquote(p) for p in [session, degree, branch, regulation, semester, subject, filename]
        ]
        
        file_path = CONTENT_DIR.joinpath(*decoded_path)
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail="Not a file")

        return FileResponse(
            file_path,
            media_type='application/octet-stream',
            filename=filename,
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )

    except HTTPException as he:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download-all/{session}/{degree}/{branch}/{regulation}/{semester}/{subject}")
async def download_all(
    session: str,
    degree: str,
    branch: str,
    regulation: str,
    semester: str,
    subject: str
):
    try:
        # Decode URL components
        decoded_path = [
            unquote(p) for p in [session, degree, branch, regulation, semester, subject]
        ]
        
        # Build full path
        full_path = CONTENT_DIR.joinpath(*decoded_path)
        
        # Validate path
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="Directory not found")
        if not full_path.is_dir():
            raise HTTPException(status_code=400, detail="Not a directory")

        # Get all files
        files = [f for f in full_path.glob('*') if f.is_file()]
        if not files:
            raise HTTPException(status_code=404, detail="No files available")

        # Create in-memory zip
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in files:
                # Ensure we're adding files (not directories)
                if file_path.is_file():
                    zip_file.write(file_path, file_path.name)

        zip_buffer.seek(0)
        
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={subject}_papers.zip"
            }
        )

    except HTTPException as he:
        raise
    except Exception as e:
        print(f"ZIP Creation Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create ZIP archive")

  
# Define backup directory
BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)  # Create the directory if it doesn't exist

# Define the folder to be backed up
SOURCE_FOLDER = Path("uploaded_papers")  # Replace with your folder path

@app.get("/api/backups")
def list_backups():
    """List all backup files sorted by creation time (newest first)."""
    backups = [f for f in os.listdir(BACKUP_DIR) if os.path.isfile(BACKUP_DIR / f)]
    
    # Sort backups by timestamp in descending order (newest first)
    backups.sort(key=lambda x: datetime.strptime(x.split("_backup")[0], "%Y-%m-%d_%H-%M-%S"), reverse=True)
    
    return backups

@app.post("/api/backups/create")
def create_backup():
    """Create a backup by compressing a folder and saving it with a timestamp."""
    try:
        if not SOURCE_FOLDER.exists():
            raise HTTPException(status_code=404, detail="Source folder not found")

        # Create a backup filename with the current date and time
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        backup_filename = f"{timestamp}_backup.zip"
        backup_path = BACKUP_DIR / backup_filename

        # Compress the folder into a .zip file
        shutil.make_archive(str(backup_path.with_suffix('')), 'zip', SOURCE_FOLDER)

        return {"message": "Backup created successfully", "backup_filename": backup_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/backups/delete/{backup_name}")
def delete_backup(backup_name: str):
    """Delete a backup file."""
    backup_path = BACKUP_DIR / backup_name
    if not backup_path.exists():
        raise HTTPException(status_code=404, detail="Backup not found")

    try:
        os.remove(backup_path)
        return {"message": "Backup deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/backups/download/{backup_name}")
def download_backup(backup_name: str):
    """Download a backup file."""
    backup_path = BACKUP_DIR / backup_name
    if not backup_path.exists():
        raise HTTPException(status_code=404, detail="Backup not found")

    return FileResponse(backup_path, filename=backup_name)

from fastapi import BackgroundTasks
import time
import random
otp_cache = {}

# Function to clean up expired OTPs
def cleanup_expired_otps():
    current_time = time.time()
    expired_keys = [email for email, (otp, expiry) in otp_cache.items() if expiry < current_time]
    for email in expired_keys:
        del otp_cache[email]
        
def generate_otp():
    return str(random.randint(100000, 999999))

class ForgotPasswordRequest(BaseModel):
    user_id: str
    email: EmailStr

@app.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if the user ID and email match in the database
        cursor.execute("SELECT regno, mail FROM users WHERE regno = %s AND mail = %s", (request.user_id, request.email))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User ID and email do not match")

        # Generate OTP
        otp = generate_otp()

        # Store OTP in local cache with a 5-minute expiration
        expiry_time = time.time() + 300  # 300 seconds = 5 minutes
        otp_cache[request.email] = (otp, expiry_time)

        # Clean up expired OTPs in the background
        background_tasks.add_task(cleanup_expired_otps)

        # Send OTP to the user's email
        subject = "Your OTP for Password Reset"
        body = f"Your OTP is: {otp}. It will expire in 5 minutes."
        send_email(request.email, subject, body)

        return {"message": "OTP sent successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
        
class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

@app.post("/verify-otp")
def verify_otp(request: VerifyOTPRequest):
    try:
        # Fetch the OTP from the local cache
        stored_otp, expiry_time = otp_cache.get(request.email, (None, None))

        if not stored_otp or stored_otp != request.otp or expiry_time < time.time():
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        # OTP is valid
        return {"message": "OTP verified successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
    confirm_password: str

@app.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    try:
        # Check if passwords match
        if request.new_password != request.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update the user's password in the database
        cursor.execute("UPDATE users SET pwd = %s WHERE mail = %s", (request.new_password, request.email))
        conn.commit()

        # Delete the OTP from the local cache
        if request.email in otp_cache:
            del otp_cache[request.email]

        return {"message": "Password reset successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()       
        
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "cletocite@gmail.com"  # Your email
SMTP_PASS = "ivpewaafeehsslfn"  # Your app password

def send_email(recipient, subject, body):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = recipient
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, recipient, msg.as_string())

if __name__ == "__main__":
    uvicorn.run("master:app", host="0.0.0.0", port=8080, reload=True)