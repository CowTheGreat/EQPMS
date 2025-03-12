from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clever Cloud Database Configuration
db_config = {
    "host": "bt31qqkildpszlog1f5m-mysql.services.clever-cloud.com",
    "user": "uzploxirchd3gy0b",
    "password": "rhKWC55mGZItVBnAFO1i",
    "database": "bt31qqkildpszlog1f5m",
    "port": 3306,
}

# Pydantic model for Faculty
class FacultySchema(BaseModel):
    name: str
    department: str
    subject: str

# Helper function to get database connection
def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database connection error: {err}")

# API endpoint to get all faculty
@app.get("/api/faculty")
def get_faculty():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM faculty")
        faculty = cursor.fetchall()
        return faculty
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        connection.close()

# API endpoint to add a new faculty member
@app.post("/api/faculty")
def add_faculty(faculty: FacultySchema):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        query = "INSERT INTO faculty (name, department, subject) VALUES (%s, %s, %s)"
        values = (faculty.name, faculty.department, faculty.subject)
        cursor.execute(query, values)
        connection.commit()
        return {"message": "Faculty added successfully"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        connection.close()

# Endpoint to get all users
@app.get("/api/users")
def get_users():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        return users
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        connection.close()

# Endpoint to get all boards
@app.get("/api/boards")
def get_boards():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM boards")
        boards = cursor.fetchall()
        return boards
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        connection.close()

# Endpoint to get all QPs from QP_main table
@app.get("/api/qps")
def get_qps():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM QP_main")  # Changed table name here
        qps = cursor.fetchall()
        return qps
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    finally:
        cursor.close()
        connection.close()



# Start the Uvicorn server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
