# Discord Chat Cleaner v2.0

⚠️ **IMPORTANT WARNING**: This tool violates Discord's Terms of Service. Using it may result in your account being suspended or banned. Use at your own risk!

## Features
- Multiple authentication methods (browser session, credentials, QR code)
- Auto-detect Discord session from Chrome/Edge/Firefox browsers
- Delete your own messages from Discord channels
- Support for both server channels and DMs
- Rate limiting to avoid API abuse
- Interactive menu interface
- Persistent token storage for convenience

## Setup Instructions

### 1. Install Node.js
Download and install Node.js from https://nodejs.org/

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
Copy `.env.example` to `.env` if you want to set a custom delete delay:
```bash
cp .env.example .env
```

## Running the Program

```bash
npm start
```

Or:

```bash
node src/index.js
```

## Authentication Methods

The program supports multiple ways to authenticate:

### 1. Auto-detect from Browser (Recommended)
- The program will automatically search for an active Discord session in Chrome, Edge, or Firefox
- Make sure you're logged into Discord in your browser
- No manual token extraction needed!

### 2. Login with Email and Password
- Enter your Discord credentials directly
- The program will open a browser window for login
- Complete any 2FA or captcha if required

### 3. Login with QR Code
- Scan the QR code with your Discord mobile app
- Similar to Discord desktop login

### 4. Manual Token Entry
- For advanced users who want to provide their token manually
- Follow the on-screen instructions to extract your token

## Usage
1. Run the program and choose an authentication method
2. Once logged in, select from the main menu:
   - Delete messages from a channel
   - Change account (switch to different Discord account)
   - Exit
3. Select the server/channel or DM
4. Enter the number of messages to delete
5. Confirm the deletion

## Features

### Persistent Authentication
- The program saves your authentication token locally (encrypted)
- Next time you run the program, it will auto-login
- Token is stored in `.discord_token` file (add to .gitignore)

### Safety Features
- 1-second delay between deletions by default (configurable)
- Confirmation prompts before deletion
- Only deletes YOUR messages
- Token validation before use

## Customization

### Delete Delay
Edit the `DELETE_DELAY` in `.env` to change the delay between message deletions (in milliseconds):
```
DELETE_DELAY=2000
```

## Troubleshooting

### Browser Cookie Extraction Not Working
- Make sure you're logged into Discord in your browser
- Try logging out and back into Discord in your browser
- On Windows, run the program as Administrator

### Login with Credentials Failed
- Check your email and password
- Complete any 2FA verification
- Complete any captcha challenges

### Token Invalid or Expired
- The program will automatically prompt for re-authentication
- Choose a different authentication method

## Security Notes
- Never share your Discord token with anyone
- The `.discord_token` file contains sensitive data - keep it secure
- Add `.discord_token` to your `.gitignore` file

## Disclaimer
This tool is for educational purposes only. The creators are not responsible for any consequences of using this tool, including but not limited to account suspension or termination. This tool violates Discord's Terms of Service and should be used at your own risk.