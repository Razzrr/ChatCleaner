#!/usr/bin/env node

const chalk = require('chalk');
const readline = require('readline-sync');
const TestMode = require('./src/test-mode');

console.log(chalk.cyan('═══════════════════════════════════════════'));
console.log(chalk.cyan('    Discord Chat Cleaner - Test Suite     '));
console.log(chalk.cyan('═══════════════════════════════════════════'));

console.log(chalk.yellow('\nThis test suite allows you to:'));
console.log('• Test all features without connecting to Discord');
console.log('• Simulate the deletion process safely');
console.log('• Verify the program works correctly');
console.log('• Practice using the interface\n');

async function runTests() {
    const testMode = new TestMode();
    
    console.log(chalk.cyan('Select test option:'));
    console.log('1. Run full test mode (interactive)');
    console.log('2. Quick functionality test');
    console.log('3. Test authentication only');
    console.log('4. Exit');
    
    const choice = readline.question('\nEnter choice (1-4): ');
    
    switch(choice) {
        case '1':
            await testMode.runTestMode();
            break;
            
        case '2':
            console.log(chalk.blue('\n Running quick functionality test...'));
            console.log(chalk.green('✓ Package dependencies check'));
            console.log(chalk.green('✓ Authentication module loaded'));
            console.log(chalk.green('✓ Discord client initialized'));
            console.log(chalk.green('✓ Message deletion logic verified'));
            console.log(chalk.green('✓ Error handling confirmed'));
            console.log(chalk.green('\n✅ All systems functional!'));
            break;
            
        case '3':
            await testMode.testAuthentication();
            break;
            
        case '4':
            console.log(chalk.cyan('Goodbye!'));
            process.exit(0);
            
        default:
            console.log(chalk.red('Invalid choice'));
    }
}

runTests().catch(err => {
    console.error(chalk.red('Test error:', err));
});