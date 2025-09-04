@echo off
echo =====================================
echo   Discord Chat Cleaner - Clean Start
echo =====================================
echo.

echo [1/3] Killing any existing processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul

echo [2/3] Waiting for ports to be released...
ping 127.0.0.1 -n 3 > nul

echo [3/3] Starting Discord Chat Cleaner...
echo.

npm run app

if errorlevel 1 (
    echo.
    echo ======================================
    echo  ERROR: Application failed to start!
    echo ======================================
    echo.
    echo Common solutions:
    echo  - Run as Administrator
    echo  - Check if port 3000 is in use
    echo  - Reinstall: npm install
    echo.
    pause
    exit /b 1
)

pause