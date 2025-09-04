@echo off
cls
echo ═══════════════════════════════════════════════════════════
echo         Discord Chat Cleaner - Easy Start                 
echo ═══════════════════════════════════════════════════════════
echo.
echo Opening Discord in your default browser...
echo.

:: Open Discord in default browser
start https://discord.com/app

echo Please wait for Discord to load in your browser...
timeout /t 5 >nul

echo.
echo ───────────────────────────────────────────────────────────
echo Once Discord is loaded in your browser:
echo.
echo 1. Press F12 to open Developer Tools
echo 2. Click on the "Console" tab
echo 3. Copy this command:
echo.
echo    window.webpackChunkdiscord_app.push([[Math.random()],[],q=^>Object.values(q.c).find(e=^>e.exports?.default?.getToken).exports.default.getToken()])
echo.
echo 4. Paste it in the Console and press Enter
echo 5. Copy the token that appears (starts with MTE or similar)
echo ───────────────────────────────────────────────────────────
echo.
set /p token="Paste your Discord token here: "

:: Save the token
echo %token% > .discord_token

echo.
echo ✓ Token saved!
echo.
echo Starting Discord Chat Cleaner...
echo.

:: Start the web server in background
start /b node src/web-server.js

:: Wait a moment for server to start
timeout /t 3 >nul

:: Open the web interface in default browser
echo Opening web interface in your browser...
start http://localhost:3000

echo.
echo ═══════════════════════════════════════════════════════════
echo ✅ Discord Chat Cleaner is now running!
echo ═══════════════════════════════════════════════════════════
echo.
echo Web interface: http://localhost:3000
echo.
echo Your browser should open automatically.
echo You're already logged in with the token you provided!
echo.
echo To stop the server, press Ctrl+C or close this window.
echo.
pause