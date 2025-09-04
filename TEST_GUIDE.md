# Testing Guide for Discord Chat Cleaner

## 🧪 Testing Options

This program includes several testing modes to verify functionality without risking your Discord account:

### 1. Test Mode (Recommended First Step)
```bash
npm test
```
Or directly:
```bash
node src/index.js --test
```

This mode:
- Uses simulated Discord data
- Tests all features without connecting to Discord
- Allows you to practice using the interface
- Verifies all components work correctly

### 2. Dry Run Mode (Test with Real Account)
```bash
npm run test:dry
```
Or:
```bash
node src/index.js --dry-run
```

This mode:
- Connects to your real Discord account
- Fetches real channels and messages
- **DOES NOT delete any messages**
- Shows exactly what would be deleted
- Perfect for testing before actual use

### 3. Interactive Test Suite
```bash
npm test
```

Choose from:
1. **Full test mode** - Complete interactive simulation
2. **Quick functionality test** - Verify all components work
3. **Test authentication only** - Test login methods without connecting

## 📋 Step-by-Step Testing Process

### Step 1: Initial Setup
```bash
# Install dependencies
npm install

# Run the test suite
npm test
```

### Step 2: Test Authentication Methods
1. Run test mode: `npm test`
2. Select option 3: "Test authentication only"
3. Try each authentication method:
   - Browser cookie detection
   - Email/password login
   - QR code login
   - Manual token entry

### Step 3: Simulate Message Deletion
1. Run test mode: `npm test`
2. Select option 1: "Run full test mode"
3. Choose "Simulate message deletion"
4. Select a test channel
5. Enter number of messages to delete
6. Watch the simulation

### Step 4: Dry Run with Real Account (Optional)
```bash
# Only do this after successful test mode
npm run test:dry
```

This will:
1. Actually connect to Discord
2. Show your real servers and channels
3. Fetch your real messages
4. **Simulate** deletion without actually deleting

### Step 5: Verify Everything Works
Run the quick test:
```bash
npm test
# Select option 2: Quick functionality test
```

Should show all green checkmarks:
- ✓ Package dependencies check
- ✓ Authentication module loaded
- ✓ Discord client initialized
- ✓ Message deletion logic verified
- ✓ Error handling confirmed

## 🔍 What to Look For

### Successful Test Indicators:
- All dependencies install without errors
- Test mode runs without crashes
- Authentication simulation works
- Message deletion simulation completes
- No error messages in console

### Common Issues and Solutions:

**Issue**: Dependencies won't install
```bash
# Clear npm cache and retry
npm cache clean --force
npm install
```

**Issue**: Test mode won't start
```bash
# Check Node.js version (need v14+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Authentication test fails
- Make sure you're following the prompts correctly
- In test mode, any input is accepted

## 🎯 Test Scenarios

### Scenario 1: Basic Functionality
1. Run `npm test`
2. Select "Quick functionality test"
3. Verify all checks pass

### Scenario 2: Full Workflow Simulation
1. Run `npm test`
2. Select "Run full test mode"
3. Test each menu option:
   - Simulate deletion
   - View test messages
   - Test authentication
   - Run dry-run

### Scenario 3: Dry Run with Real Data
1. Run `npm run test:dry`
2. Authenticate with your Discord account
3. Select a channel with messages you've sent
4. Enter a small number (like 5) for deletion count
5. Verify it shows your actual messages but doesn't delete them

## ✅ Ready for Real Use?

After successful testing:
1. All test modes work without errors ✓
2. Dry run mode shows correct messages ✓
3. You understand the interface ✓
4. You've read the warnings about Discord TOS ✓

Then you can run the actual program:
```bash
npm start
```

## ⚠️ Safety Tips

1. **Always test first** - Use test mode before real mode
2. **Start small** - Delete just a few messages first
3. **Use dry run** - Verify what will be deleted
4. **Check the channel** - Make sure you're in the right place
5. **Backup important info** - Deleted messages can't be recovered

## 🆘 Troubleshooting

If tests fail, check:
1. Node.js version: `node --version` (need v14+)
2. All files are present in src/ directory
3. Dependencies installed: `npm install`
4. No antivirus blocking the program

For help, check the main README.md or report issues.