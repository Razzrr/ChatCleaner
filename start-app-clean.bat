@echo off
echo =====================================
echo   Discord Chat Cleaner - Clean Start
echo =====================================
echo.

echo Cleaning up previous processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting Discord Chat Cleaner...
echo.
npm run app

if errorlevel 1 (
    echo.
    echo Application failed to start!
    echo Please check for errors above.
    pause
    exit /b 1
)

pause