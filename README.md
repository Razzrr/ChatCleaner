# Discord Chat Cleaner

A desktop application to manage and delete your Discord messages.

## ⚠️ Warning
This tool violates Discord's Terms of Service. Use at your own risk - your account may be banned.
You can only delete YOUR OWN messages.

## Features
- 🗑️ Delete messages from any channel or DM
- 👥 Browse servers and direct messages
- 🔍 Preview messages before deletion
- 🧪 Dry run mode for testing
- ☢️ Nuclear option to delete all messages everywhere
- 🖥️ Clean desktop interface

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Usage

### Desktop App (Recommended)
```bash
npm start
```

### Command Line Interface
```bash
npm run cli
```

### Web Interface Only
```bash
npm run web
```

## Authentication Methods
1. **Manual Token** - Enter your Discord token directly
2. **Browser Auto-detect** - Automatically find token from Chrome/Edge/Firefox
3. **Email & Password** - Login with credentials
4. **QR Code** - Scan with Discord mobile app

## How to Get Your Token
1. Open Discord in your browser
2. Press F12 to open Developer Tools
3. Go to the Network tab
4. Type `/api` in the filter box
5. Refresh the page (F5)
6. Click on any request to /api
7. Look for "Authorization" in Request Headers
8. Copy the token value (without quotes)

## Building for Distribution
```bash
npm run build
```

## License
Use at your own risk. This tool is for educational purposes only.