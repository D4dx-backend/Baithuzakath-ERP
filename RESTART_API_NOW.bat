@echo off
echo ========================================
echo   RESTARTING API SERVER
echo ========================================
echo.

echo Step 1: Stopping current API server (Process ID 4680)...
taskkill /F /PID 4680 2>nul
if %errorlevel% equ 0 (
    echo    SUCCESS: API server stopped
) else (
    echo    INFO: Process may have already stopped
)
echo.

echo Step 2: Waiting 2 seconds...
timeout /t 2 /nobreak >nul
echo.

echo Step 3: Starting API server...
cd api
start "API Server" cmd /k "npm run dev"
echo    SUCCESS: API server starting in new window
echo.

echo Step 4: Waiting 5 seconds for server to start...
timeout /t 5 /nobreak >nul
echo.

echo ========================================
echo   API SERVER RESTARTED!
echo ========================================
echo.
echo The API server should now be running on http://localhost:8000
echo.
echo Next steps:
echo 1. Go back to your browser
echo 2. Press Ctrl+Shift+R to hard refresh
echo 3. The 403 error should be gone!
echo.
echo If you still see errors, try logging out and logging back in.
echo.
pause
