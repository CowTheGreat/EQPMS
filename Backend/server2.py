from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import platform
from fastapi import HTTPException
from fastapi import BackgroundTasks


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
        
        # Build path according to directory structure
        for i, segment in enumerate(path_segments):
            if i == 0:  # Session
                full_path /= segment
            elif i == 1:  # Regulation
                full_path /= segment
            elif i == 2:  # Board
                full_path = full_path / "board" / segment
            elif i == 3:  # Semester
                full_path /= segment
            elif i == 4:  # Subject
                full_path /= segment

        if not full_path.exists():
            raise HTTPException(status_code=404, detail="Path not found")

        # Run in background to return immediate response
        background_tasks.add_task(open_explorer, full_path)
        return {"status": "request_accepted"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)