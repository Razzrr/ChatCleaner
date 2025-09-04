@echo off
echo Building Discord Chat Cleaner Desktop App...
echo.
echo This will create a standalone desktop application.
echo Please run this script as Administrator if it fails.
echo.

:: Clean previous builds
if exist dist rmdir /s /q dist

:: Build the app
echo Building the application...
npx electron-builder --win portable --publish never -c.npmRebuild=false -c.win.certificateFile=null -c.win.certificatePassword=null

if errorlevel 1 (
    echo.
    echo Build failed! Try running as Administrator.
    pause
    exit /b 1
)

echo.
echo Build complete! The portable exe is in the dist folder.
echo.
pause