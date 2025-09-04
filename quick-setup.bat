@echo off
cls
echo ═══════════════════════════════════════════════════════════
echo           Discord Chat Cleaner - Quick Setup              
echo ═══════════════════════════════════════════════════════════
echo.
echo This will help you get your Discord token quickly.
echo.
echo STEP 1: Getting your Discord Token
echo ───────────────────────────────────
echo.
echo 1. Open Discord in your browser (Chrome/Edge recommended)
echo    Link: https://discord.com/app
echo.
echo 2. Press F12 to open Developer Tools
echo.
echo 3. Go to the "Console" tab
echo.
echo 4. Copy and paste this command exactly:
echo.
echo    window.webpackChunkdiscord_app.push([[Math.random()],[],q=^>Object.values(q.c).find(e=^>e.exports?.default?.getToken).exports.default.getToken()])
echo.
echo 5. Press Enter - Your token will appear
echo.
echo 6. Copy the token (looks like: MTE1MDM2Mj...)
echo.
echo ───────────────────────────────────
echo.
set /p token="Paste your token here and press Enter: "

echo %token% > .discord_token
echo.
echo ✓ Token saved successfully!
echo.
echo STEP 2: Starting the Web Interface
echo ───────────────────────────────────
echo.
timeout /t 2 >nul
start http://localhost:3000
start /b node src/web-server.js
echo.
echo ✅ Web interface is now running at http://localhost:3000
echo.
echo The browser should open automatically.
echo Your token has been saved and you'll be logged in automatically!
echo.
echo Press any key to close this window...
pause >nul