@echo off
REM Product Color & Image Management Setup Script for Windows
REM This script sets up the database tables for color and image management

echo ==========================================
echo Product Color ^& Image Management Setup
echo ==========================================
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo Error: backend\.env file not found!
    echo Please create the .env file with database credentials.
    pause
    exit /b 1
)

echo Please ensure PostgreSQL bin directory is in your PATH
echo Example: C:\Program Files\PostgreSQL\15\bin
echo.

REM Prompt for database details
set /p DB_HOST="Enter database host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Enter database port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME="Enter database name: "
set /p DB_USER="Enter database user: "
set /p DB_PASSWORD="Enter database password: "

echo.
echo Database: %DB_NAME%
echo User: %DB_USER%
echo Host: %DB_HOST%:%DB_PORT%
echo.

REM Confirm before proceeding
set /p CONFIRM="Do you want to run the migration? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Migration cancelled.
    pause
    exit /b 0
)

echo.
echo Running migration...
echo.

REM Set password environment variable for psql
set PGPASSWORD=%DB_PASSWORD%

REM Run the migration
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f backend\database\migrations\add_product_colors_and_images.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo Migration completed successfully!
    echo ==========================================
    echo.
    echo Next steps:
    echo 1. Restart your backend server
    echo 2. Clear frontend cache ^(npm run build^)
    echo 3. Test the new features in the product edit modal
    echo.
) else (
    echo.
    echo ==========================================
    echo Migration failed!
    echo ==========================================
    echo.
    echo Please check the error messages above.
    echo Common issues:
    echo - Database connection failed
    echo - Tables already exist ^(safe to ignore^)
    echo - Permission denied
    echo - psql not found in PATH
    echo.
)

REM Clear password from environment
set PGPASSWORD=

pause
