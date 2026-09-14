@echo off
echo ====================================================================
echo   Starting AIVOA Pharma QMS AI Customer Complaint Management System
echo ====================================================================
echo.

start "AIVOA Backend (FastAPI)" cmd /k "cd backend && uvicorn app.main:app --reload --port 8000"
timeout /t 2 /nobreak >nul

start "AIVOA Frontend (React + Redux)" cmd /k "cd frontend && npm run dev"

echo Backend running at http://127.0.0.1:8000
echo Frontend running at http://localhost:3000
echo.
echo Press any key to exit this launcher window...
pause >nul
