from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import jwt
from datetime import datetime, timedelta
import uvicorn
from pydantic.networks import EmailStr

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
        valid_boards = {"Science", "Commerce", "Arts"}
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

if __name__ == "__main__":
    uvicorn.run("master:app", host="0.0.0.0", port=8080, reload=True)