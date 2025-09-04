const readline = require('readline-sync');
const chalk = require('chalk');

class TestMode {
    constructor() {
        this.testMessages = [];
        this.testChannels = [
            { id: '1', name: 'general', type: 'GUILD_TEXT', guild: 'Test Server' },
            { id: '2', name: 'random', type: 'GUILD_TEXT', guild: 'Test Server' },
            { id: '3', name: 'Test DM', type: 'DM', recipient: 'TestUser#1234' }
        ];
        this.generateTestMessages();
    }

    generateTestMessages() {
        const sampleMessages = [
            "Hey everyone!",
            "Check out this cool thing I found",
            "Anyone want to play games?",
            "I'm going to delete these messages",
            "This is a test message",
            "Discord message cleaner test",
            "Another message here",
            "Testing the deletion feature",
            "Message number 9",
            "Last test message"
        ];

        for (let i = 0; i < 50; i++) {
            this.testMessages.push({
                id: `msg_${i}`,
                content: sampleMessages[i % sampleMessages.length],
                author: 'You',
                timestamp: new Date(Date.now() - (i * 60000)).toISOString(),
                channel: this.testChannels[i % 3].name
            });
        }
    }

    async simulateLogin() {
        console.log(chalk.blue('\n🧪 TEST MODE - Simulating Discord login...'));
        await this.sleep(1000);
        console.log(chalk.green('✓ Test login successful! Connected as TestUser#1234'));
        return 'test_token_12345';
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runTestMode() {
        console.log(chalk.magenta('\n════════════════════════════════════════'));
        console.log(chalk.magenta('           TEST MODE ACTIVE             '));
        console.log(chalk.magenta('════════════════════════════════════════'));
        console.log(chalk.yellow('This mode simulates the deletion process without'));
        console.log(chalk.yellow('actually connecting to Discord or deleting messages.\n'));

        while (true) {
            console.log(chalk.cyan('\n═══════════════════════════════════'));
            console.log(chalk.cyan('         Test Mode Menu            '));
            console.log(chalk.cyan('═══════════════════════════════════'));
            console.log('1. Simulate message deletion');
            console.log('2. View test messages');
            console.log('3. Test authentication methods');
            console.log('4. Run dry-run deletion');
            console.log('5. Exit test mode');

            const choice = readline.question('\nEnter choice (1-5): ');

            switch(choice) {
                case '1':
                    await this.simulateDeletion();
                    break;
                case '2':
                    this.viewTestMessages();
                    break;
                case '3':
                    await this.testAuthentication();
                    break;
                case '4':
                    await this.dryRunDeletion();
                    break;
                case '5':
                    console.log(chalk.magenta('\nExiting test mode...'));
                    return;
                default:
                    console.log(chalk.red('Invalid choice'));
            }
        }
    }

    async simulateDeletion() {
        console.log(chalk.cyan('\nSelect test channel:'));
        this.testChannels.forEach((channel, index) => {
            console.log(`${index + 1}. ${channel.guild ? `#${channel.name} (${channel.guild})` : channel.name}`);
        });

        const channelIndex = parseInt(readline.question('\nSelect channel (1-3): ')) - 1;
        if (channelIndex < 0 || channelIndex >= this.testChannels.length) {
            console.log(chalk.red('Invalid selection'));
            return;
        }

        const selectedChannel = this.testChannels[channelIndex];
        const channelMessages = this.testMessages.filter(m => m.channel === selectedChannel.name);
        
        console.log(chalk.blue(`\nFound ${channelMessages.length} messages in ${selectedChannel.name}`));
        
        const count = parseInt(readline.question('How many messages to delete? '));
        if (isNaN(count) || count <= 0) {
            console.log(chalk.red('Invalid number'));
            return;
        }

        const toDelete = Math.min(count, channelMessages.length);
        console.log(chalk.yellow(`\nSimulating deletion of ${toDelete} messages...`));

        for (let i = 0; i < toDelete; i++) {
            await this.sleep(200);
            console.log(chalk.green(`✓ [SIMULATED] Deleted message ${i + 1}/${toDelete}: "${channelMessages[i].content.substring(0, 30)}..."`));
        }

        console.log(chalk.green(`\n✅ Simulation complete! Would have deleted ${toDelete} messages`));
    }

    viewTestMessages() {
        console.log(chalk.cyan('\n═══════════════════════════════════'));
        console.log(chalk.cyan('         Test Messages             '));
        console.log(chalk.cyan('═══════════════════════════════════'));

        this.testChannels.forEach(channel => {
            const messages = this.testMessages.filter(m => m.channel === channel.name);
            console.log(chalk.yellow(`\n${channel.name} (${messages.length} messages):`));
            messages.slice(0, 5).forEach(msg => {
                console.log(`  - ${msg.content}`);
            });
            if (messages.length > 5) {
                console.log(`  ... and ${messages.length - 5} more`);
            }
        });
    }

    async testAuthentication() {
        console.log(chalk.cyan('\n═══════════════════════════════════'));
        console.log(chalk.cyan('    Test Authentication Methods    '));
        console.log(chalk.cyan('═══════════════════════════════════'));
        console.log('1. Simulate browser cookie detection');
        console.log('2. Simulate email/password login');
        console.log('3. Simulate QR code login');
        console.log('4. Simulate manual token entry');

        const choice = readline.question('\nSelect method to test (1-4): ');

        switch(choice) {
            case '1':
                console.log(chalk.blue('\n[TEST] Searching for Discord session in browsers...'));
                await this.sleep(1500);
                console.log(chalk.green('✓ [TEST] Found session in Chrome'));
                console.log(chalk.green('✓ [TEST] Token extracted successfully'));
                break;
            case '2':
                const email = readline.question('\n[TEST] Enter test email: ');
                const password = readline.question('[TEST] Enter test password: ', { hideEchoBack: true });
                console.log(chalk.blue('\n[TEST] Attempting login...'));
                await this.sleep(2000);
                console.log(chalk.green(`✓ [TEST] Login successful for ${email}`));
                break;
            case '3':
                console.log(chalk.blue('\n[TEST] Generating QR code...'));
                await this.sleep(1000);
                console.log(chalk.yellow('[TEST] QR Code displayed (simulated)'));
                console.log(chalk.yellow('[TEST] Waiting for mobile scan...'));
                await this.sleep(2000);
                console.log(chalk.green('✓ [TEST] QR code scanned successfully'));
                break;
            case '4':
                const token = readline.question('\n[TEST] Enter test token: ');
                console.log(chalk.blue('[TEST] Validating token...'));
                await this.sleep(1000);
                console.log(chalk.green(`✓ [TEST] Token valid: ${token.substring(0, 10)}...`));
                break;
            default:
                console.log(chalk.red('Invalid choice'));
        }
    }

    async dryRunDeletion() {
        console.log(chalk.yellow('\n═══════════════════════════════════════'));
        console.log(chalk.yellow('          DRY RUN MODE                 '));
        console.log(chalk.yellow('═══════════════════════════════════════'));
        console.log(chalk.cyan('This will show exactly what would happen'));
        console.log(chalk.cyan('without actually deleting any messages.\n'));

        console.log(chalk.blue('Step 1: Authentication'));
        console.log('  → Would authenticate with Discord');
        console.log('  → Would validate user token');
        
        await this.sleep(1000);

        console.log(chalk.blue('\nStep 2: Fetch channels'));
        console.log('  → Would fetch all accessible servers');
        console.log('  → Would fetch all DM conversations');
        
        await this.sleep(1000);

        console.log(chalk.blue('\nStep 3: Select channel'));
        console.log('  → User would select from available channels');
        console.log('  → Example: #general in "My Server"');
        
        await this.sleep(1000);

        console.log(chalk.blue('\nStep 4: Fetch messages'));
        console.log('  → Would fetch last 100 messages');
        console.log('  → Would filter for user\'s own messages');
        console.log('  → Found: 47 deletable messages');
        
        await this.sleep(1000);

        console.log(chalk.blue('\nStep 5: Delete messages'));
        console.log('  → Would delete messages one by one');
        console.log('  → 1 second delay between each deletion');
        console.log('  → Estimated time: 47 seconds');

        console.log(chalk.green('\n✅ Dry run complete! No messages were actually deleted.'));
    }
}

module.exports = TestMode;