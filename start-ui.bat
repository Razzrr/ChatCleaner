@echo off
echo ═══════════════════════════════════════════
echo    Discord Chat Cleaner - Web Interface    
echo ═══════════════════════════════════════════
echo.
echo Starting web interface...
echo.
echo The interface will open in your browser at:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
timeout /t 2 >nul
start http://localhost:3000
node src/web-server.js