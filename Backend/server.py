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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)