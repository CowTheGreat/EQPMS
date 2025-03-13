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
            "SELECT subject_code, subject_name, QP_Type FROM boards WHERE degree = %s AND regulation = %s AND board_name = %s AND semester = %s",
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
    subject_type: str  # ✅ Include QP_Type
    assigned_faculty_regno: list[str]
    deadline: datetime

# @app.post("/assign-qp")
# def assign_qp(data: AssignQPRequest):
#     print("Received Data:", data.dict())  # ✅ Debugging

#     try:
#         conn = get_db_connection()
#         cursor = conn.cursor()

#         current_year = datetime.now().year
#         year_code = (current_year - 1) % 100 if data.semester % 2 == 0 else current_year % 100

#         # Odd (1) / Even (2) semester
#         semester_type = "1" if data.semester % 2 != 0 else "2"

#         # Degree Type: B.E or B.Tech are considered UG (1), others are PG (2)
#         if data.degree.upper() in ["B.E", "B.TECH"]:
#             degree_type = "1"  # UG
#         else:
#             degree_type = "2"  # PG

#         # Fetch faculty Type
#         cursor.execute("SELECT employee_type FROM users WHERE regno = %s", (data.assigned_faculty_regno[0],))
#         result = cursor.fetchone()
#         if not result:
#             raise HTTPException(status_code=404, detail=f"Faculty with regno {data.assigned_faculty_regno[0]} not found")
#         faculty_type = result[0]

#         qp_type = "1" if faculty_type == "Internal" else "2"

#         current_year = datetime.now().year
#         last_year = current_year - 1

#         if data.semester % 2 == 0:
#             session_title = f"May{str(last_year)[-2:]}"
#         else:
#             session_title = f"Dec{str(current_year)[-2:]}"

#         # Fetch last serial number from DB
#         cursor.execute(
#             """
#             SELECT MAX(CAST(SUBSTRING(QP_Ref_no, -3) AS UNSIGNED)) FROM QP 
#             WHERE QP_Session = %s AND QP_Degree = %s
#             """,
#             (session_title, data.degree)
#         )
#         last_serial = cursor.fetchone()[0]
#         serial_number = int(last_serial) + 1 if last_serial else 1

#         # Format serial number as 3-digit (001, 002, ...)
#         serial_str = f"{serial_number:03}"

#         for regno in data.assigned_faculty_regno:
#             # Generate unique QP Reference Number
#             qp_ref_no = f"{year_code}{semester_type}{degree_type}{qp_type}{serial_str}"

#             # Fetch faculty name
#             cursor.execute("SELECT name FROM users WHERE regno = %s", (regno,))
#             result = cursor.fetchone()
#             if not result:
#                 raise HTTPException(status_code=404, detail=f"Faculty with regno {regno} not found")
#             faculty_name = result[0]

#             # Insert into database
#             cursor.execute(
#                 """
#                 INSERT INTO QP (QP_Ref_no, QP_Session, QP_Degree, QP_Regulation, QP_Board, 
#                                 QP_Semester, QP_Subjectcode, QP_Subject, QP_Type,
#                                 QP_Faculty_assigned, QP_Faculty_assigned_Regno, QP_Deadline)
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#                 """,
#                 (
#                     qp_ref_no,
#                     session_title,
#                     data.degree,
#                     data.regulation,
#                     data.board,
#                     data.semester,
#                     data.subject_code,
#                     data.subject_name,
#                     data.subject_type,  
#                     faculty_name,
#                     regno,
#                     data.deadline
#                 )
#             )

#         conn.commit()
#         return {"message": "QP assigned successfully!", "QP_Ref_no": qp_ref_no}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error assigning QP: {str(e)}")

#     finally:
#         cursor.close()
#         conn.close()

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
        year_code = (current_year - 1) % 100 if data.semester % 2 == 0 else current_year % 100

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
            background_tasks.add_task(send_email, faculty_mail, subject, body)

        conn.commit()
        return {"message": "QP assigned successfully and notification emails sent!", "QP_Ref_no": qp_ref_no}

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
UPLOAD_DIR = "uploaded_papers"

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), username: str = Form(...), qp_ref: str = Form(...)):
    """Uploads a file and saves it in a structured folder hierarchy."""

    # 📌 Get QP details from database
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

    # 📌 Create folder hierarchy
    session = qp_data["QP_Session"].replace(" ", "")
    degree = qp_data["QP_Degree"].replace(" ", "")
    regulation = qp_data["QP_Regulation"].replace(" ", "")
    board = qp_data["QP_Board"].replace(" ", "")
    semester = f"Sem{qp_data['QP_Semester']}"
    subject_code = qp_data["QP_Subjectcode"].replace(" ", "")
    subject_name = qp_data["QP_Subject"].replace(" ", "").replace("/", "_")

    folder_path = os.path.join(UPLOAD_DIR, session, degree, board, regulation, semester, subject_code)
    os.makedirs(folder_path, exist_ok=True)

    # 📌 Save file with proper naming
    file_name = f"{qp_ref}_{subject_code}_{subject_name}_{username}.docx"
    file_path = os.path.join(folder_path, file_name)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return {"message": f"File uploaded successfully: {file_name}", "file_path": file_path}

# ✅ API to Fetch Uploaded Files
@app.get("/uploaded_files/{qp_ref}")
def get_uploaded_file(qp_ref: str):
    """Returns the uploaded file path for a given QP reference number."""
    for root, dirs, files in os.walk(UPLOAD_DIR):
        for file in files:
            if file.startswith(qp_ref):
                file_path = os.path.join(root, file)
                file_url = f"http://localhost:8080/download/{qp_ref}"
                return {"file_url": file_url}

    raise HTTPException(status_code=404, detail="File not found.")

# ✅ API to Download Uploaded Files
@app.get("/download/{qp_ref}")
def download_file(qp_ref: str):
    """Serves the uploaded file for download."""
    for root, dirs, files in os.walk(UPLOAD_DIR):
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

@app.post("/broadcast")
def broadcast_mail(background_tasks: BackgroundTasks):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    query = """
    SELECT qp.QP_Subjectcode, qp.QP_Subject, qp.QP_Deadline, f.name, f.mail 
    FROM qp qp 
    JOIN users f ON qp.QP_Faculty_assigned_Regno = f.regno 
    WHERE qp.QP_Status != 'Locked'
    """
    
    cursor.execute(query)
    pending_qps = cursor.fetchall()
    
    for qp in pending_qps:
        subject = f"Reminder: Pending Question Paper Submission ({qp['QP_Subjectcode']})"
        body = f"Hello {qp['name']},\n\nYou have not yet locked the question paper for {qp['QP_Subject']}.\nDeadline: {qp['QP_Deadline']}\nPlease complete it at the earliest.\n\nRegards,\nAdmin"
        background_tasks.add_task(send_email, qp['mail'], subject, body)
        print("Mail sent to", qp['mail'])
    
    cursor.close()
    db.close()
    
    return {"message": "Broadcast emails scheduled"}

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

# Set folder path
FILES_DIR = "C:/Users/cowar/OneDrive/Desktop/EQPMS/Backend/uploaded_papers"

# Serve static files
app.mount("/files", StaticFiles(directory=FILES_DIR), name="files")

@app.get("/list-files")
def list_files():
    files = [{"name": f, "url": f"/files/{f}"} for f in os.listdir(FILES_DIR) if os.path.isfile(os.path.join(FILES_DIR, f))]
    return {"files": files}

if __name__ == "__main__":
    uvicorn.run("master:app", host="0.0.0.0", port=8080, reload=True)