# Quick Start Guide

## 🚀 Immediate Testing (No Risk)

### Option 1: Run Test Mode
Double-click `run_test.bat` or run:
```bash
node src/index.js --test
```

This will show you:
- Simulated Discord servers and channels
- Fake messages you can "delete"
- All features working without any real connection

### Option 2: Quick Test
```bash
npm test
```
Then press `2` for quick functionality test

## 📋 What You'll See in Test Mode:

1. **Main Menu:**
   - Simulate message deletion
   - View test messages
   - Test authentication methods
   - Run dry-run deletion

2. **Simulated Channels:**
   - Test Server #general
   - Test Server #random  
   - Test DM with TestUser

3. **Test Messages:**
   - 50 sample messages across channels
   - Realistic Discord message format
   - Safe to "delete" - they're all fake!

## 🎮 Try This Test Sequence:

1. Start test mode: `node src/index.js --test`
2. Select "1" - Simulate message deletion
3. Choose channel "1" - #general
4. Enter "5" messages to delete
5. Watch the simulated deletion process

## ✅ When Test Mode Works:

You're ready to:
1. Try dry-run mode with your real account (no deletions)
2. Use the actual program (be careful!)

## ⚡ Quick Commands:

- **Test mode**: `npm test`
- **Dry run**: `npm run test:dry`
- **Real mode**: `npm start`

Remember: Test mode is 100% safe - no Discord connection!