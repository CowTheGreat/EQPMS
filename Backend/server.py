from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure static files
BASE_DIR = Path(__file__).parent
CONTENT_DIR = BASE_DIR / "data" / "sessions"

# Add validation for directory structure
def validate_path(*path_parts):
    full_path = CONTENT_DIR.joinpath(*path_parts)
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    return full_path

# Add the missing sessions endpoint
@app.get("/api/sessions/")
async def get_sessions():
    try:
        path = CONTENT_DIR
        if not path.exists():
            return []
        return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/{session}/regulations/")
async def get_regulations(session: str):
    path = validate_path(session)
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{regulation}/boards/")
async def get_boards(session: str, regulation: str):
    path = validate_path(session, regulation, "board")
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{regulation}/{board}/semesters/")
async def get_semesters(session: str, regulation: str, board: str):
    path = validate_path(session, regulation, "board", board)
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{regulation}/{board}/{semester}/subjects/")
async def get_subjects(session: str, regulation: str, board: str, semester: str):
    path = validate_path(session, regulation, "board", board, semester)
    return [{"value": d.name, "label": d.name} for d in path.iterdir() if d.is_dir()]

@app.get("/api/{session}/{regulation}/{board}/{semester}/{subject}/files/")
async def get_files(session: str, regulation: str, board: str, semester: str, subject: str):
    path = validate_path(session, regulation, "board", board, semester, subject)
    return [
        {"name": f.name, "url": f"/content/{session}/{regulation}/board/{board}/{semester}/{subject}/{f.name}"}
        for f in path.iterdir() if f.is_file()
    ]

app.mount("/content", StaticFiles(directory=CONTENT_DIR), name="content")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)