@echo off
echo ========================================
echo Starting HealPay Backend Server
echo ========================================
echo.
cd /d D:\FYP-Final\healpay-backend
echo Starting uvicorn on port 8000...
venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
