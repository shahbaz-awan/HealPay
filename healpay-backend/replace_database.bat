@echo off
echo ===== Database Replacement Script =====
echo.

echo Checking for running processes...
tasklist | findstr /i "python.exe" >nul
if %errorlevel% equ 0 (
    echo Warning: Python processes are running. They might be using the database.
    echo.
)

echo Step 1: Trying to close VS Code database preview...
timeout /t 2 /nobreak >nul

echo Step 2: Attempting to delete old database...
del /F /Q healpay.db 2>nul
if %errorlevel% equ 0 (
    echo [OK] Old database deleted
) else (
    echo [WARNING] Could not delete old database - it may be locked
    echo.
    echo Please close VS Code or any database viewer, then run this script again.
    echo.
    echo Manual steps:
    echo 1. Close healpay.db in VS Code if it's open
    echo 2. Run: del /F healpay.db
    echo 3. Run: ren healpay_new.db healpay.db
    pause
    exit /b 1
)

echo Step 3: Renaming new database...
ren healpay_new.db healpay.db
if %errorlevel% equ 0 (
    echo [OK] Database replaced successfully!
) else (
    echo [ERROR] Failed to rename new database
    pause
    exit /b 1
)

echo.
echo ===== Database Fixed! =====
echo.
echo You can now start the backend server:
echo   python main.py
echo.
echo Default credentials:
echo   admin@healpay.com / admin123
echo   doctor@healpay.com / doctor123
echo   patient@healpay.com / patient123
echo.
pause
