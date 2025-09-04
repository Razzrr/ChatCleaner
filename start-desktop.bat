@echo off
echo =======================================
echo   Discord Chat Cleaner - Desktop App
echo =======================================
echo.

:: Check if Node.js is installed (for development)
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Starting Discord Chat Cleaner Desktop App...
echo.

:: Run the Electron app
npm run app

if %errorlevel% neq 0 (
    echo.
    echo Failed to start the desktop app!
    echo.
    echo Try running: npm install
    pause
    exit /b 1
)

pause