# Discord Chat Cleaner - Desktop Application

## Running the Desktop App

### Development Mode
Run the desktop app in development mode:
```bash
npm run app
```
Or double-click `start-desktop.bat`

### Standalone Executable
The built desktop application is located in:
```
dist\discord-chat-cleaner-win32-x64\discord-chat-cleaner.exe
```

You can:
1. Navigate to the `dist\discord-chat-cleaner-win32-x64\` folder
2. Double-click `discord-chat-cleaner.exe` to run the app
3. Optionally, create a shortcut to this exe file on your desktop

## Features
- Runs as a standalone desktop application
- No browser required
- System tray integration
- All web interface features available in desktop mode

## Building the Desktop App
To rebuild the desktop application after making changes:
```bash
npx electron-packager . discord-chat-cleaner --platform=win32 --arch=x64 --out=dist --overwrite
```

Or use the build script:
```bash
build-desktop.bat
```

## Troubleshooting

### App doesn't start
- Make sure no other application is using port 3000
- Try running the app as Administrator
- Check if antivirus is blocking the application

### Server connection errors
The app includes an embedded web server. If you see connection errors:
1. Wait a few seconds for the server to fully start
2. Try restarting the application
3. Check Windows Firewall settings

### Cache errors
Cache errors like "Unable to move the cache: Access is denied" are normal and can be ignored. They don't affect the app's functionality.

## Distribution
To distribute the desktop app:
1. Zip the entire `dist\discord-chat-cleaner-win32-x64` folder
2. Share the zip file
3. Users can extract and run `discord-chat-cleaner.exe` directly