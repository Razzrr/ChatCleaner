# Discord Chat Cleaner - Automated Setup
Clear-Host

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "         Discord Chat Cleaner - Automated Setup            " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Open Discord in default browser
Write-Host "Opening Discord in your browser..." -ForegroundColor Yellow
Start-Process "https://discord.com/app"

Write-Host "Waiting for Discord to load..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Display instructions
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Instructions to get your Discord token:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Discord should now be open in your browser" -ForegroundColor White
Write-Host "2. Press F12 to open Developer Tools" -ForegroundColor White
Write-Host "3. Click on the 'Console' tab" -ForegroundColor White
Write-Host "4. Copy and paste this command:" -ForegroundColor White
Write-Host ""
Write-Host "   window.webpackChunkdiscord_app.push([[Math.random()],[],q=>Object.values(q.c).find(e=>e.exports?.default?.getToken).exports.default.getToken()])" -ForegroundColor Green
Write-Host ""
Write-Host "5. Press Enter - your token will appear" -ForegroundColor White
Write-Host "6. Copy the token (looks like: MTE1MDM2Mj...)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Get token from user
$token = Read-Host "Paste your Discord token here"

# Save token
$token | Out-File -FilePath ".discord_token" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✓ Token saved successfully!" -ForegroundColor Green
Write-Host ""

# Start the web server
Write-Host "Starting Discord Chat Cleaner server..." -ForegroundColor Yellow
$server = Start-Process node -ArgumentList "src/web-server.js" -PassThru -WindowStyle Hidden

# Wait for server to start
Start-Sleep -Seconds 3

# Open web interface in default browser
Write-Host "Opening web interface in your browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Discord Chat Cleaner is now running!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Web interface: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your browser should open automatically."
Write-Host "You're already logged in with the token you provided!"
Write-Host ""
Write-Host "Press any key to stop the server and exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop the server
Stop-Process -Id $server.Id -Force
Write-Host "Server stopped." -ForegroundColor Red