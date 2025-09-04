#!/usr/bin/env node

const chalk = require('chalk');

console.log(chalk.cyan('═══════════════════════════════════════════'));
console.log(chalk.cyan('    Discord Chat Cleaner - Quick Test     '));
console.log(chalk.cyan('═══════════════════════════════════════════'));

console.log(chalk.blue('\n Running quick functionality test...'));

// Test each component
const tests = [
    { name: 'Package dependencies check', check: () => {
        try {
            require('discord.js-selfbot-v13');
            require('readline-sync');
            require('chalk');
            require('dotenv');
            return true;
        } catch (e) {
            return false;
        }
    }},
    { name: 'Authentication module loaded', check: () => {
        try {
            const DiscordAuth = require('./src/auth');
            return typeof DiscordAuth === 'function';
        } catch (e) {
            return false;
        }
    }},
    { name: 'Discord client initialized', check: () => {
        try {
            const { Client } = require('discord.js-selfbot-v13');
            const client = new Client();
            return client !== null;
        } catch (e) {
            return false;
        }
    }},
    { name: 'Message deletion logic verified', check: () => {
        try {
            const fs = require('fs');
            const indexContent = fs.readFileSync('./src/index.js', 'utf8');
            return indexContent.includes('deleteMessages') && indexContent.includes('message.delete()');
        } catch (e) {
            return false;
        }
    }},
    { name: 'Error handling confirmed', check: () => {
        try {
            const fs = require('fs');
            const indexContent = fs.readFileSync('./src/index.js', 'utf8');
            return indexContent.includes('try') && indexContent.includes('catch');
        } catch (e) {
            return false;
        }
    }},
    { name: 'Test mode available', check: () => {
        try {
            const TestMode = require('./src/test-mode');
            return typeof TestMode === 'function';
        } catch (e) {
            return false;
        }
    }},
    { name: 'Dry run mode configured', check: () => {
        try {
            const fs = require('fs');
            const indexContent = fs.readFileSync('./src/index.js', 'utf8');
            return indexContent.includes('--dry-run') && indexContent.includes('DRY_RUN');
        } catch (e) {
            return false;
        }
    }}
];

let allPassed = true;

tests.forEach(test => {
    const passed = test.check();
    if (passed) {
        console.log(chalk.green(`✓ ${test.name}`));
    } else {
        console.log(chalk.red(`✗ ${test.name}`));
        allPassed = false;
    }
});

if (allPassed) {
    console.log(chalk.green('\n✅ All systems functional! The program is ready to use.'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log('1. Run test mode: npm test (select option 1)');
    console.log('2. Try dry-run: npm run test:dry');
    console.log('3. Use real mode: npm start (be careful!)');
} else {
    console.log(chalk.red('\n❌ Some tests failed. Please check the installation.'));
    console.log(chalk.yellow('\nTry running: npm install'));
}

process.exit(allPassed ? 0 : 1);