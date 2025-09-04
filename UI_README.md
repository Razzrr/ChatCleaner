# Discord Chat Cleaner - User Interface Guide

## 🎨 Available Interfaces

### 1. Web Interface (Browser-based)
A modern web interface that runs in your browser.

**Quick Start:**
```bash
npm run web
```
Or double-click: `start-ui.bat`

Then open: http://localhost:3000

### 2. Desktop Application (Electron)
A standalone desktop application with system tray support.

**Quick Start:**
```bash
npm run app
```
Or double-click: `start-app.bat`

### 3. Command Line Interface
The original CLI interface.

**Quick Start:**
```bash
npm start
```

## 🚀 Web Interface Features

### Authentication Methods
- **Browser Session** - Auto-detects Discord login from Chrome/Edge/Firefox
- **Email & Password** - Direct login with Discord credentials
- **QR Code** - Scan with Discord mobile app
- **Manual Token** - Enter Discord token manually

### Main Features
- **Server Browser** - Browse all your Discord servers
- **Channel Selection** - Select specific channels to clean
- **Direct Messages** - Clean DM conversations
- **Message Preview** - See messages before deletion
- **Deletion Progress** - Real-time progress tracking
- **Dry Run Mode** - Test without actually deleting

### Safety Features
- Confirmation prompts before deletion
- Dry run mode for testing
- Real-time status updates
- Detailed deletion logs
- Rate limiting to avoid API abuse

## 📱 Using the Web Interface

### Step 1: Start the Server
```bash
npm run web
```
The server will start on http://localhost:3000

### Step 2: Open in Browser
- The browser should open automatically
- If not, manually navigate to http://localhost:3000

### Step 3: Authenticate
1. Choose your preferred authentication method
2. Follow the prompts to login
3. Your credentials are saved locally for convenience

### Step 4: Select Messages
1. Browse your servers or DMs
2. Select a channel
3. Preview the messages
4. Choose how many to delete

### Step 5: Delete Messages
1. Select operation mode:
   - **Normal** - Actually deletes messages
   - **Dry Run** - Simulates deletion only
2. Enter number of messages to delete
3. Click "Start Deletion"
4. Monitor progress in real-time

## 💻 Desktop App Features

The desktop app includes:
- System tray integration
- Minimize to tray
- Native window controls
- All web interface features

## 🎯 Interface Comparison

| Feature | CLI | Web UI | Desktop App |
|---------|-----|--------|-------------|
| Easy to use | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Visual feedback | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Real-time updates | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| System integration | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Resource usage | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🛠️ Troubleshooting

### Web Interface Won't Start
```bash
# Check if port 3000 is in use
netstat -an | findstr :3000

# Use a different port
PORT=3001 npm run web
```

### Can't Connect to Server
- Ensure the server is running
- Check firewall settings
- Try http://127.0.0.1:3000 instead

### Authentication Failed
- Clear saved credentials: Delete `.discord_token` file
- Try a different authentication method
- Check Discord login in your browser

## 🔒 Security Notes

- The web interface only runs locally (localhost)
- No external connections except to Discord
- Credentials are stored locally only
- Use HTTPS if exposing to network

## 📊 Performance Tips

- Close unnecessary browser tabs
- Use desktop app for better performance
- Limit deletion batches to 100 messages
- Enable rate limiting in settings

## 🎨 Customization

### Change Port
Edit `.env` file:
```
PORT=3001
```

### Change Theme
Edit `public/styles.css` to customize colors and styles.

## 🚦 Status Indicators

- 🟢 **Green** - Success/Connected
- 🔵 **Blue** - Information
- 🟡 **Yellow** - Warning
- 🔴 **Red** - Error/Disconnected

## ⚡ Quick Commands

```bash
# Web interface
npm run web

# Desktop app
npm run app

# CLI interface
npm start

# Test mode
npm test

# Build desktop app
npm run build-app
```

## 📝 Notes

- Web interface requires modern browser (Chrome, Firefox, Edge)
- Desktop app requires Windows 7+ or macOS 10.10+
- Both interfaces use the same backend
- Can run multiple interfaces simultaneously

Enjoy the new user interface! 🎉