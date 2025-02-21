from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import os
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔴 Open for testing, restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Configuration
# db_config = {
#     "user": os.getenv("MYSQL_ADDON_USER"),
#     "password": os.getenv("MYSQL_ADDON_PASSWORD"),
#     "host": os.getenv("MYSQL_ADDON_HOST"),
#     "database": os.getenv("MYSQL_ADDON_DB"),
# }

db_config = {
    "user": "root",
    "password": "CowTheGreat",
    "host": "localhost",
    "database": "eqpms",
}

# Function to create a MySQL connection
def get_db_connection():
    return mysql.connector.connect(**db_config)

# Pydantic model for request validation
class LoginRequest(BaseModel):
    id: str
    password: str
    role: str  # ✅ Role should be sent from frontend

db = get_db_connection()
cursor = db.cursor(dictionary=True)
query = f"SELECT * FROM users"  # ✅ Dynamic table selection
cursor.execute(query)
result = cursor.fetchone()
print(result)

# Generic Login Endpoint (Determines Table from Role)
@app.post("/login")
def login_user(login: LoginRequest):
    if login.role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    table_name = "users" if login.role == "user" else "admins"  # ✅ Determine table

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    query = f"SELECT id, pwd FROM {table_name} WHERE id = %s"
    cursor.execute(query, (login.id,))
    result = cursor.fetchone()

    cursor.close()
    db.close()

    if result and result["pwd"] == login.password:
        return {"message": "Login successful", "id": result["id"]}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

if __name__ == "__main__":
    uvicorn.run("master:app", host="0.0.0.0", port=8080, reload=True)