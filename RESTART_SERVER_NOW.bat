@echo off
echo ========================================
echo   RESTARTING API SERVER
echo ========================================
echo.

echo Step 1: Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ Node processes killed
) else (
    echo ! No Node processes found
)
echo.

echo Step 2: Waiting 2 seconds...
timeout /t 2 /nobreak >nul
echo.

echo Step 3: Starting API server...
cd api
start "API Server" cmd /k "npm run dev"
echo ✓ API server starting in new window
echo.

echo ========================================
echo   DONE!
echo ========================================
echo.
echo The API server should now be running in a new window.
echo Look for the message: "Server running on port 8000"
echo.
echo Then refresh your browser (F5)
echo.
pause
