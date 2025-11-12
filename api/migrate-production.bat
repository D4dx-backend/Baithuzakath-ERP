@echo off
REM Production Database Migration Script for Windows
REM This script migrates users in the production MongoDB database

echo.
echo ========================================
echo Production User Location Migration
echo ========================================
echo.

if "%~1"=="" (
    echo Error: MongoDB URI not provided
    echo.
    echo Usage:
    echo   migrate-production.bat "mongodb+srv://user:pass@cluster.mongodb.net/db"
    echo.
    echo Or set environment variable:
    echo   set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
    echo   migrate-production.bat
    echo.
    exit /b 1
)

set MONGODB_URI=%~1

echo WARNING: This will modify your PRODUCTION database!
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Running migration...
echo.

REM Run the migration script
node scripts/migrate-production-users.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo   1. Refresh your frontend application
    echo   2. Go to User Management page
    echo   3. Verify location hierarchy displays correctly
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
    exit /b 1
)
