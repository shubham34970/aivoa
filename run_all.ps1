Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Starting AIVOA Pharma QMS AI Customer Complaint Management System" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn app.main:app --reload --port 8000"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Backend running at http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Frontend running at http://localhost:3000" -ForegroundColor Yellow
