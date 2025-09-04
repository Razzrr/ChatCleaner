require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const readline = require('readline-sync');
const chalk = require('chalk');
const DiscordAuth = require('./auth');
const TestMode = require('./test-mode');

const client = new Client();
const auth = new DiscordAuth();
const DELETE_DELAY = parseInt(process.env.DELETE_DELAY) || 1000;
const DRY_RUN = process.argv.includes('--dry-run');
const TEST_MODE = process.argv.includes('--test');

console.log(chalk.yellow('═══════════════════════════════════════════'));
console.log(chalk.yellow('       Discord Message Cleaner v2.0        '));
console.log(chalk.yellow('═══════════════════════════════════════════'));

if (DRY_RUN) {
    console.log(chalk.magenta('\n🔒 DRY RUN MODE - No messages will be deleted'));
} else if (TEST_MODE) {
    console.log(chalk.magenta('\n🧪 TEST MODE - Using simulated data'));
} else {
    console.log(chalk.red('\n⚠️  WARNING: This tool violates Discord TOS'));
    console.log(chalk.red('⚠️  Use at your own risk - Account may be banned'));
    console.log(chalk.red('⚠️  You can only delete YOUR OWN messages\n'));
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDiscordToken() {
    let token = null;
    
    const savedToken = auth.loadSavedToken();
    if (savedToken) {
        console.log(chalk.blue('Found saved token, validating...'));
        const user = await auth.validateToken(savedToken);
        if (user) {
            console.log(chalk.green(`✓ Saved token valid for user: ${user.username}`));
            return savedToken;
        } else {
            console.log(chalk.yellow('Saved token is invalid or expired'));
        }
    }
    
    if (process.env.DISCORD_TOKEN) {
        console.log(chalk.blue('Found token in .env file, validating...'));
        const user = await auth.validateToken(process.env.DISCORD_TOKEN);
        if (user) {
            console.log(chalk.green(`✓ .env token valid for user: ${user.username}`));
            auth.saveToken(process.env.DISCORD_TOKEN);
            return process.env.DISCORD_TOKEN;
        } else {
            console.log(chalk.yellow('Token in .env is invalid or expired'));
        }
    }
    
    console.log(chalk.cyan('\n═══════════════════════════════════'));
    console.log(chalk.cyan('      Authentication Methods       '));
    console.log(chalk.cyan('═══════════════════════════════════'));
    console.log('1. Auto-detect from browser (Chrome/Edge/Firefox)');
    console.log('2. Login with email and password');
    console.log('3. Login with QR code');
    console.log('4. Enter token manually');
    console.log('5. Exit');
    
    const choice = readline.question('\nSelect authentication method (1-5): ');
    
    switch(choice) {
        case '1':
            console.log(chalk.blue('\nSearching for Discord session in browsers...'));
            token = await auth.getTokenFromBrowserCookies();
            if (!token) {
                console.log(chalk.red('No Discord session found in browsers'));
                console.log(chalk.yellow('Make sure you are logged into Discord in your browser'));
            }
            break;
            
        case '2':
            const email = readline.question('Enter Discord email: ');
            const password = readline.question('Enter Discord password: ', { hideEchoBack: true });
            token = await auth.loginWithCredentials(email, password);
            break;
            
        case '3':
            token = await auth.loginWithQRCode();
            break;
            
        case '4':
            console.log(chalk.yellow('\nHow to get your token:'));
            console.log('1. Open Discord in browser and press F12');
            console.log('2. Go to Network tab and send a message');
            console.log('3. Find the "Authorization" header in requests');
            token = readline.question('\nEnter Discord token: ');
            const user = await auth.validateToken(token);
            if (!user) {
                console.log(chalk.red('Invalid token'));
                token = null;
            } else {
                console.log(chalk.green(`✓ Token valid for user: ${user.username}`));
            }
            break;
            
        case '5':
            console.log(chalk.cyan('Goodbye!'));
            process.exit(0);
            
        default:
            console.log(chalk.red('Invalid choice'));
    }
    
    if (token) {
        auth.saveToken(token);
    }
    
    return token;
}

async function deleteMessages(channel, messageCount) {
    try {
        let deleted = 0;
        let lastId;
        
        console.log(chalk.blue(`\nFetching messages from ${channel.name || 'DM'}...`));
        
        while (deleted < messageCount) {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;
            
            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) {
                console.log(chalk.yellow('\nNo more messages to fetch'));
                break;
            }
            
            const myMessages = messages.filter(m => m.author.id === client.user.id);
            
            for (const message of myMessages.values()) {
                if (deleted >= messageCount) break;
                
                try {
                    if (DRY_RUN) {
                        console.log(chalk.yellow(`[DRY RUN] Would delete message ${deleted + 1}/${messageCount}: "${message.content.substring(0, 50)}..."`));
                        deleted++;
                    } else {
                        await message.delete();
                        deleted++;
                        console.log(chalk.green(`✓ Deleted message ${deleted}/${messageCount}`));
                    }
                    await sleep(DELETE_DELAY);
                } catch (err) {
                    console.log(chalk.red(`✗ Failed to delete message: ${err.message}`));
                }
            }
            
            lastId = messages.last().id;
            
            if (myMessages.size === 0 && messages.size > 0) {
                console.log(chalk.yellow('No more of your messages found in recent history'));
                break;
            }
        }
        
        console.log(chalk.green(`\n✅ Deletion complete! Deleted ${deleted} messages`));
        
    } catch (error) {
        console.error(chalk.red('Error during deletion:', error));
    }
}

async function selectChannel() {
    console.log(chalk.cyan('\nSelect channel type:'));
    console.log('1. Server Channel');
    console.log('2. Direct Message');
    
    const choice = readline.question('\nEnter choice (1-2): ');
    
    if (choice === '1') {
        const guilds = client.guilds.cache;
        console.log(chalk.cyan('\nYour Servers:'));
        
        const guildArray = Array.from(guilds.values());
        guildArray.forEach((guild, index) => {
            console.log(`${index + 1}. ${guild.name}`);
        });
        
        const guildIndex = parseInt(readline.question('\nSelect server number: ')) - 1;
        if (guildIndex < 0 || guildIndex >= guildArray.length) {
            console.log(chalk.red('Invalid selection'));
            return null;
        }
        
        const selectedGuild = guildArray[guildIndex];
        const channels = selectedGuild.channels.cache.filter(c => c.type === 'GUILD_TEXT');
        
        console.log(chalk.cyan('\nText Channels:'));
        const channelArray = Array.from(channels.values());
        channelArray.forEach((channel, index) => {
            console.log(`${index + 1}. #${channel.name}`);
        });
        
        const channelIndex = parseInt(readline.question('\nSelect channel number: ')) - 1;
        if (channelIndex < 0 || channelIndex >= channelArray.length) {
            console.log(chalk.red('Invalid selection'));
            return null;
        }
        
        return channelArray[channelIndex];
        
    } else if (choice === '2') {
        const dms = client.channels.cache.filter(c => c.type === 'DM');
        
        if (dms.size === 0) {
            console.log(chalk.yellow('No DM channels found in cache'));
            const userId = readline.question('Enter user ID to fetch DM: ');
            try {
                const user = await client.users.fetch(userId);
                return await user.createDM();
            } catch (err) {
                console.log(chalk.red('Failed to fetch user'));
                return null;
            }
        }
        
        console.log(chalk.cyan('\nDirect Messages:'));
        const dmArray = Array.from(dms.values());
        dmArray.forEach((dm, index) => {
            console.log(`${index + 1}. ${dm.recipient.username}`);
        });
        
        const dmIndex = parseInt(readline.question('\nSelect DM number: ')) - 1;
        if (dmIndex < 0 || dmIndex >= dmArray.length) {
            console.log(chalk.red('Invalid selection'));
            return null;
        }
        
        return dmArray[dmIndex];
    }
    
    return null;
}

async function main() {
    // Run test mode if requested
    if (TEST_MODE) {
        const testMode = new TestMode();
        await testMode.runTestMode();
        return;
    }
    
    const token = await getDiscordToken();
    
    if (!token) {
        console.log(chalk.red('\n❌ Failed to obtain Discord token'));
        console.log(chalk.yellow('Please try a different authentication method'));
        process.exit(1);
    }
    
    console.log(chalk.blue('\nConnecting to Discord...'));
    
    client.on('ready', async () => {
        console.log(chalk.green(`\n✅ Logged in as ${client.user.username}`));
        
        while (true) {
            console.log(chalk.cyan('\n═══════════════════════════════════'));
            console.log(chalk.cyan('            Main Menu              '));
            console.log(chalk.cyan('═══════════════════════════════════'));
            console.log('1. Delete messages from a channel');
            console.log('2. Change account');
            console.log('3. Exit');
            
            const choice = readline.question('\nEnter choice (1-3): ');
            
            if (choice === '1') {
                const channel = await selectChannel();
                if (!channel) continue;
                
                const messageCount = parseInt(readline.question('\nHow many of your messages to delete? '));
                if (isNaN(messageCount) || messageCount <= 0) {
                    console.log(chalk.red('Invalid number'));
                    continue;
                }
                
                const confirm = readline.question(chalk.yellow(`\nConfirm deletion of ${messageCount} messages? (yes/no): `));
                if (confirm.toLowerCase() === 'yes') {
                    await deleteMessages(channel, messageCount);
                } else {
                    console.log(chalk.yellow('Deletion cancelled'));
                }
                
            } else if (choice === '2') {
                console.log(chalk.yellow('\nRestarting with new authentication...'));
                client.destroy();
                setTimeout(() => main(), 1000);
                return;
                
            } else if (choice === '3') {
                console.log(chalk.cyan('\nGoodbye!'));
                process.exit(0);
            } else {
                console.log(chalk.red('Invalid choice'));
            }
        }
    });
    
    client.on('error', (error) => {
        console.error(chalk.red('Client error:', error));
    });
    
    try {
        await client.login(token);
    } catch (err) {
        console.error(chalk.red('\n❌ Failed to login:', err.message));
        console.log(chalk.yellow('\nToken may be invalid or expired'));
        console.log(chalk.yellow('Restarting authentication...'));
        setTimeout(() => main(), 2000);
    }
}

main().catch(err => {
    console.error(chalk.red('Fatal error:', err));
    process.exit(1);
});