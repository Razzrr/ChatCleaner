const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { Client } = require('discord.js-selfbot-v13');
const DiscordAuth = require('./auth');
const chalk = require('chalk');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

let discordClient = null;
let currentUser = null;
let isDeleting = false;
let isPaused = false;
let shouldStop = false;
let deleteProgress = { current: 0, total: 0, status: 'idle' };

// Discord operations
class DiscordManager {
    constructor(socket) {
        this.socket = socket;
        this.auth = new DiscordAuth();
        this.client = null;
    }

    async authenticate(method, credentials = {}) {
        try {
            let token = null;
            
            switch(method) {
                case 'browser':
                    this.socket.emit('status', { message: 'Starting automatic authentication...', type: 'info' });
                    // Use the new auto-auth method
                    token = await this.auth.autoAuthenticate();
                    if (!token) {
                        // Fallback to browser cookies
                        token = await this.auth.getTokenFromBrowserCookies();
                    }
                    break;
                    
                case 'auto':
                    this.socket.emit('status', { message: 'Starting automatic authentication...', type: 'info' });
                    const AutoAuth = require('./auto-auth');
                    const autoAuth = new AutoAuth();
                    token = await autoAuth.quickAuth();
                    break;
                    
                case 'credentials':
                    this.socket.emit('status', { message: 'Logging in with credentials...', type: 'info' });
                    token = await this.auth.loginWithCredentials(credentials.email, credentials.password);
                    break;
                    
                case 'qr':
                    this.socket.emit('status', { message: 'Opening QR code login...', type: 'info' });
                    token = await this.auth.loginWithQRCode();
                    break;
                    
                case 'token':
                    this.socket.emit('status', { message: 'Validating token...', type: 'info' });
                    const user = await this.auth.validateToken(credentials.token);
                    if (user) {
                        token = credentials.token;
                    }
                    break;
                    
                case 'saved':
                    token = this.auth.loadSavedToken();
                    if (token) {
                        const user = await this.auth.validateToken(token);
                        if (!user) token = null;
                    }
                    break;
            }
            
            if (!token) {
                throw new Error('Authentication failed');
            }
            
            // Save token for future use
            this.auth.saveToken(token);
            
            // Login to Discord with proper intents for selfbot
            this.client = new Client({
                checkUpdate: false,
                // Enable DM channel caching
                partials: ['CHANNEL', 'MESSAGE', 'USER']
            });
            discordClient = this.client;
            
            return new Promise((resolve, reject) => {
                this.client.on('ready', async () => {
                    currentUser = {
                        id: this.client.user.id,
                        username: this.client.user.username,
                        discriminator: this.client.user.discriminator,
                        avatar: this.client.user.avatarURL()
                    };

                    // Try to fetch DM channels after ready
                    console.log('Client ready, fetching private channels...');
                    try {
                        // For selfbot v13, we need to use the proper method
                        if (this.client.channels.cache) {
                            console.log(`Initial channel cache size: ${this.client.channels.cache.size}`);
                        }
                    } catch (error) {
                        console.error('Error checking channels:', error);
                    }

                    this.socket.emit('authenticated', currentUser);
                    resolve(currentUser);
                });
                
                this.client.on('error', (error) => {
                    reject(error);
                });
                
                // Clean the token - remove any quotes or extra characters
                const cleanToken = token.replace(/['"]/g, '').trim();
                console.log(`Attempting to login with token (length: ${cleanToken.length})`);
                this.client.login(cleanToken).catch((error) => {
                    console.error('Discord login failed:', error.message);
                    reject(error);
                });
            });
            
        } catch (error) {
            this.socket.emit('status', { message: `Authentication failed: ${error.message}`, type: 'error' });
            throw error;
        }
    }

    async getServers() {
        if (!this.client) throw new Error('Not authenticated');
        
        const servers = [];
        this.client.guilds.cache.forEach(guild => {
            servers.push({
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL(),
                memberCount: guild.memberCount
            });
        });
        
        return servers;
    }

    async getChannels(serverId) {
        if (!this.client) throw new Error('Not authenticated');
        
        const guild = this.client.guilds.cache.get(serverId);
        if (!guild) throw new Error('Server not found');
        
        const channels = [];
        guild.channels.cache
            .filter(channel => channel.type === 'GUILD_TEXT')
            .forEach(channel => {
                channels.push({
                    id: channel.id,
                    name: channel.name,
                    type: 'text'
                });
            });
        
        return channels;
    }

    async getDMs() {
        if (!this.client) throw new Error('Not authenticated');

        console.log('Fetching DM channels...');

        // Fetch DM channels - the selfbot library might handle this differently
        const dms = [];

        // Try to get DM channels from cache first
        const dmChannels = this.client.channels.cache.filter(channel =>
            channel.type === 'DM' || channel.type === 1
        );

        console.log(`Found ${dmChannels.size} DM channels in cache`);

        // If no DMs in cache, try to fetch them
        if (dmChannels.size === 0) {
            console.log('No DMs in cache, attempting to fetch...');
            // For selfbot, we might need to access private channels differently
            try {
                // Try accessing user's DM channels through relationships
                if (this.client.relationships) {
                    console.log('Checking relationships...');
                    const friends = this.client.relationships.cache.filter(r => r.type === 1);
                    console.log(`Found ${friends.size} friends in relationships`);
                }

                // Try fetching channels
                await this.client.channels.fetch();
            } catch (error) {
                console.error('Error fetching channels:', error);
            }
        }

        // Process found DM channels
        dmChannels.forEach(dm => {
            try {
                if (dm.recipient) {
                    dms.push({
                        id: dm.id,
                        username: dm.recipient.username || 'Unknown User',
                        discriminator: dm.recipient.discriminator || '0000',
                        avatar: dm.recipient.avatarURL ? dm.recipient.avatarURL() : null
                    });
                    console.log(`Added DM: ${dm.recipient.username}`);
                }
            } catch (error) {
                console.error(`Error processing DM channel ${dm.id}:`, error);
            }
        });

        console.log(`Returning ${dms.length} DMs`);
        return dms;
    }

    async previewMessages(channelId, limit = 10) {
        if (!this.client) throw new Error('Not authenticated');

        console.log(`Fetching messages for channel: ${channelId}`);

        const channel = this.client.channels.cache.get(channelId);
        if (!channel) {
            console.error(`Channel not found: ${channelId}`);
            throw new Error('Channel not found');
        }

        console.log(`Found channel: ${channel.type === 'DM' ? 'DM with ' + channel.recipient?.username : channel.name}`);

        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            console.log(`Fetched ${messages.size} total messages`);

            const myMessages = messages.filter(m => m.author.id === this.client.user.id);
            console.log(`Found ${myMessages.size} messages from current user`);

            const preview = [];
            let count = 0;
            for (const message of myMessages.values()) {
                if (count >= limit) break;
                preview.push({
                    id: message.id,
                    content: message.content || '[No content]',
                    timestamp: message.createdTimestamp,
                    attachments: message.attachments.size
                });
                count++;
            }

            console.log(`Returning preview with ${preview.length} messages out of ${myMessages.size} total`);

            return {
                total: myMessages.size,
                preview: preview,
                channelName: channel.type === 'DM' ? channel.recipient?.username : channel.name
            };
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    async deleteMessages(channelId, count, dryRun = false, deleteAll = false) {
        if (!this.client) throw new Error('Not authenticated');
        if (isDeleting) throw new Error('Already deleting messages');
        
        const channel = this.client.channels.cache.get(channelId);
        if (!channel) throw new Error('Channel not found');
        
        isDeleting = true;
        isPaused = false;
        shouldStop = false;
        
        // If deleteAll is true, set count to a very high number
        if (deleteAll) {
            count = 999999;
            this.socket.emit('status', { message: 'Starting to delete ALL messages...', type: 'info' });
        }
        
        deleteProgress = { current: 0, total: count, status: 'active' };
        
        try {
            let deleted = 0;
            let lastId;
            let consecutiveEmpty = 0;
            
            while (deleted < count && !shouldStop) {
                // Check if paused
                while (isPaused && !shouldStop) {
                    this.socket.emit('status', { message: 'Deletion paused...', type: 'info' });
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                if (shouldStop) {
                    this.socket.emit('status', { message: 'Deletion stopped by user', type: 'warning' });
                    break;
                }
                
                const options = { limit: 100 };
                if (lastId) options.before = lastId;
                
                const messages = await channel.messages.fetch(options);
                if (messages.size === 0) {
                    consecutiveEmpty++;
                    if (consecutiveEmpty >= 2 || deleteAll) {
                        this.socket.emit('status', { message: 'No more messages to delete', type: 'info' });
                        break;
                    }
                    continue;
                }
                consecutiveEmpty = 0;
                
                const myMessages = messages.filter(m => m.author.id === this.client.user.id);
                
                if (myMessages.size === 0 && messages.size > 0) {
                    // Try to fetch older messages
                    lastId = messages.last().id;
                    if (deleteAll) {
                        continue; // Keep searching for delete all
                    } else {
                        this.socket.emit('status', { message: 'No more of your messages found', type: 'info' });
                        break;
                    }
                }
                
                for (const message of myMessages.values()) {
                    if (deleted >= count && !deleteAll) break;
                    if (shouldStop) break;
                    
                    // Check if paused
                    while (isPaused && !shouldStop) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                    if (shouldStop) break;
                    
                    if (dryRun) {
                        this.socket.emit('message-deleted', {
                            current: deleted + 1,
                            total: deleteAll ? '∞' : count,
                            content: message.content ? message.content.substring(0, 50) : '[No content]',
                            dryRun: true,
                            timestamp: message.createdTimestamp
                        });
                    } else {
                        try {
                            await message.delete();
                            this.socket.emit('message-deleted', {
                                current: deleted + 1,
                                total: deleteAll ? '∞' : count,
                                content: message.content ? message.content.substring(0, 50) : '[No content]',
                                timestamp: message.createdTimestamp
                            });
                        } catch (err) {
                            this.socket.emit('status', { 
                                message: `Failed to delete message: ${err.message}`, 
                                type: 'warning' 
                            });
                        }
                    }
                    
                    deleted++;
                    deleteProgress.current = deleted;
                    
                    // Rate limiting - 1 second between deletions
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                lastId = messages.last().id;
            }
            
            deleteProgress.status = shouldStop ? 'stopped' : 'complete';
            this.socket.emit('deletion-complete', { 
                deleted, 
                dryRun, 
                stopped: shouldStop,
                allDeleted: deleteAll 
            });
            
        } catch (error) {
            deleteProgress.status = 'error';
            this.socket.emit('status', { message: `Error: ${error.message}`, type: 'error' });
            throw error;
        } finally {
            isDeleting = false;
            isPaused = false;
            shouldStop = false;
        }
    }

    async deleteAllMessagesEverywhere(selectedServers = [], selectedDMs = []) {
        if (!this.client) throw new Error('Not authenticated');
        if (isDeleting) throw new Error('Already deleting messages');
        
        console.log(chalk.red('🔥 NUCLEAR DELETE INITIATED'));
        console.log(chalk.cyan(`User: ${this.client.user.username} (${this.client.user.id})`));
        console.log(chalk.cyan(`Selected servers: ${selectedServers.length || 'ALL'}`));
        console.log(chalk.cyan(`Selected DMs: ${selectedDMs.length || 'ALL'}`));
        
        isDeleting = true;
        isPaused = false;
        shouldStop = false;
        
        this.socket.emit('status', { 
            message: '🔥 NUCLEAR DELETE INITIATED - DELETING ONLY YOUR MESSAGES...', 
            type: 'warning' 
        });
        
        let totalDeleted = 0;
        const results = {
            servers: [],
            dms: [],
            totalDeleted: 0,
            errors: []
        };
        
        try {
            // Test mode - delete from one channel first
            const testMode = false; // Set to true for testing
            
            if (testMode) {
                console.log(chalk.yellow('TEST MODE: Only processing first channel'));
            }
            // Process all servers
            const guilds = this.client.guilds.cache;
            let serverCount = 0;
            
            for (const guild of guilds.values()) {
                if (shouldStop) break;
                
                // Skip if this server wasn't selected
                if (selectedServers.length > 0 && !selectedServers.includes(guild.id)) {
                    console.log(chalk.yellow(`Skipping unselected server: ${guild.name}`));
                    continue;
                }
                
                serverCount++;
                this.socket.emit('nuclear-progress', {
                    type: 'server',
                    name: guild.name,
                    current: serverCount,
                    total: selectedServers.length || guilds.size
                });
                
                const channels = guild.channels.cache.filter(c => c.type === 'GUILD_TEXT');
                
                for (const channel of channels.values()) {
                    if (shouldStop) break;
                    
                    try {
                        // Check if still connected
                        if (!this.client || !this.client.user) {
                            console.log(chalk.red('Client disconnected during nuclear delete'));
                            throw new Error('Connection lost during deletion');
                        }
                        
                        // Check for permissions
                        if (!channel.permissionsFor || !channel.permissionsFor(this.client.user)) continue;
                        if (!channel.permissionsFor(this.client.user).has('VIEW_CHANNEL')) continue;
                        
                        console.log(chalk.blue(`Processing: ${guild.name} #${channel.name}`));
                        
                        this.socket.emit('nuclear-progress', {
                            type: 'channel',
                            server: guild.name,
                            channel: channel.name
                        });
                        
                        let deleted = await this.deleteChannelMessages(channel);
                        if (deleted > 0) {
                            totalDeleted += deleted;
                            results.servers.push({
                                server: guild.name,
                                channel: channel.name,
                                deleted: deleted
                            });
                            
                            this.socket.emit('nuclear-progress', {
                                type: 'deleted',
                                location: `${guild.name} #${channel.name}`,
                                count: deleted,
                                total: totalDeleted
                            });
                            
                            console.log(chalk.green(`Deleted ${deleted} messages from ${guild.name} #${channel.name}`));
                            
                            // Take a 10 second break after deleting from a channel
                            console.log(chalk.yellow('Taking a break to avoid rate limits...'));
                            await new Promise(resolve => setTimeout(resolve, 10000));
                        }
                    } catch (err) {
                        console.log(chalk.red(`Error in ${guild.name} #${channel.name}: ${err.message}`));
                        results.errors.push(`${guild.name} #${channel.name}: ${err.message}`);
                    }
                }
            }
            
            // Process all DMs
            const dms = this.client.channels.cache.filter(c => c.type === 'DM');
            let dmCount = 0;
            
            for (const dm of dms.values()) {
                if (shouldStop) break;
                
                // Skip if this DM wasn't selected
                if (selectedDMs.length > 0 && !selectedDMs.includes(dm.id)) {
                    console.log(chalk.yellow(`Skipping unselected DM: ${dm.recipient ? dm.recipient.username : 'Unknown'}`));
                    continue;
                }
                
                dmCount++;
                const recipient = dm.recipient;
                
                this.socket.emit('nuclear-progress', {
                    type: 'dm',
                    name: recipient ? recipient.username : 'Unknown',
                    current: dmCount,
                    total: selectedDMs.length || dms.size
                });
                
                try {
                    let deleted = await this.deleteChannelMessages(dm);
                    if (deleted > 0) {
                        totalDeleted += deleted;
                        results.dms.push({
                            user: recipient ? recipient.username : 'Unknown',
                            deleted: deleted
                        });
                        
                        this.socket.emit('nuclear-progress', {
                            type: 'deleted',
                            location: `DM with ${recipient ? recipient.username : 'Unknown'}`,
                            count: deleted,
                            total: totalDeleted
                        });
                        
                        console.log(chalk.green(`Deleted ${deleted} messages from DM with ${recipient ? recipient.username : 'Unknown'}`));
                    }
                } catch (err) {
                    console.log(chalk.red(`Error in DM with ${recipient ? recipient.username : 'Unknown'}: ${err.message}`));
                    results.errors.push(`DM ${recipient ? recipient.username : 'Unknown'}: ${err.message}`);
                }
            }
            
            results.totalDeleted = totalDeleted;
            
            this.socket.emit('nuclear-complete', results);
            
        } catch (error) {
            this.socket.emit('status', { 
                message: `Nuclear delete error: ${error.message}`, 
                type: 'error' 
            });
            throw error;
        } finally {
            isDeleting = false;
            isPaused = false;
            shouldStop = false;
        }
    }
    
    async deleteChannelMessages(channel) {
        let deleted = 0;
        let lastId;
        let consecutiveEmpty = 0;
        
        while (!shouldStop) {
            // Check if paused
            while (isPaused && !shouldStop) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (shouldStop) break;
            
            const options = { limit: 100 };
            if (lastId) options.before = lastId;
            
            try {
                const messages = await channel.messages.fetch(options);
                
                if (messages.size === 0) {
                    consecutiveEmpty++;
                    if (consecutiveEmpty >= 2) break;
                    continue;
                }
                consecutiveEmpty = 0;
                
                // ONLY delete messages from the authenticated user
                const myMessages = messages.filter(m => m.author.id === this.client.user.id);
                
                if (myMessages.size === 0 && messages.size > 0) {
                    lastId = messages.last().id;
                    continue;
                }
                
                for (const message of myMessages.values()) {
                    if (shouldStop) break;
                    
                    // Check if paused
                    while (isPaused && !shouldStop) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                    if (shouldStop) break;
                    
                    try {
                        // Check if still connected
                        if (!this.client || !this.client.user) {
                            console.log(chalk.red('Connection lost during deletion'));
                            break;
                        }
                        
                        // Double-check this is our message before deleting
                        if (message.author.id !== this.client.user.id) {
                            console.log(chalk.yellow(`Skipping message not from user: ${message.author.username}`));
                            continue;
                        }
                        
                        await message.delete();
                        deleted++;
                        
                        // Send progress update for each deletion
                        this.socket.emit('nuclear-log', `Deleted message ${deleted} in current channel`);
                        
                        // Rate limiting - 3-5 seconds random delay to appear more human-like
                        const delay = 3000 + Math.random() * 2000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } catch (err) {
                        // Log specific error for debugging
                        console.log(chalk.yellow(`Cannot delete message: ${err.message}`));
                        this.socket.emit('nuclear-log', `Skipped message: ${err.message}`);
                    }
                }
                
                if (messages.size > 0) {
                    lastId = messages.last().id;
                }
                
            } catch (err) {
                // Log the error for debugging
                console.log(chalk.red(`Channel access error: ${err.message}`));
                this.socket.emit('nuclear-log', `Channel error: ${err.message}`);
                break;
            }
        }
        
        return deleted;
    }

    disconnect() {
        if (this.client) {
            this.client.destroy();
            this.client = null;
            discordClient = null;
            currentUser = null;
        }
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(chalk.green('Client connected'));
    const manager = new DiscordManager(socket);
    
    // Check for saved authentication
    socket.on('check-auth', async () => {
        try {
            const auth = new DiscordAuth();
            const token = auth.loadSavedToken();
            if (token) {
                const user = await auth.validateToken(token);
                if (user) {
                    await manager.authenticate('saved');
                    socket.emit('authenticated', currentUser);
                }
            }
        } catch (error) {
            // No saved auth or invalid
        }
    });
    
    socket.on('authenticate', async (data) => {
        try {
            await manager.authenticate(data.method, data.credentials);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    socket.on('get-servers', async () => {
        try {
            const servers = await manager.getServers();
            socket.emit('servers', servers);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    socket.on('get-channels', async (serverId) => {
        try {
            const channels = await manager.getChannels(serverId);
            socket.emit('channels', channels);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    socket.on('get-dms', async () => {
        try {
            const dms = await manager.getDMs();
            socket.emit('dms', dms);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    socket.on('preview-messages', async (channelId) => {
        try {
            const preview = await manager.previewMessages(channelId);
            socket.emit('message-preview', preview);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    socket.on('delete-messages', async (data) => {
        try {
            await manager.deleteMessages(data.channelId, data.count, data.dryRun, data.deleteAll);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    socket.on('pause-deletion', () => {
        isPaused = true;
        socket.emit('status', { message: 'Deletion paused', type: 'info' });
    });
    
    socket.on('resume-deletion', () => {
        isPaused = false;
        socket.emit('status', { message: 'Deletion resumed', type: 'info' });
    });
    
    socket.on('stop-deletion', () => {
        shouldStop = true;
        isPaused = false;
        socket.emit('status', { message: 'Stopping deletion...', type: 'warning' });
    });
    
    socket.on('nuclear-delete', async (options = {}) => {
        try {
            const selectedServers = options.servers || [];
            const selectedDMs = options.dms || [];
            await manager.deleteAllMessagesEverywhere(selectedServers, selectedDMs);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    socket.on('logout', () => {
        manager.disconnect();
        socket.emit('logged-out');
    });
    
    socket.on('disconnect', () => {
        console.log(chalk.yellow('Client disconnected'));
        manager.disconnect();
    });
});

// API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        connected: discordClient !== null,
        user: currentUser,
        deleting: isDeleting,
        progress: deleteProgress
    });
});

// Start server with error handling
const PORT = process.env.PORT || 3000;
let serverStarted = false;

// Check if server is already started
if (!serverStarted) {
    server.listen(PORT, () => {
        serverStarted = true;
        console.log(chalk.green(`\n═══════════════════════════════════════════`));
        console.log(chalk.green(`      Discord Chat Cleaner Web Interface`));
        console.log(chalk.green(`═══════════════════════════════════════════`));
        console.log(chalk.cyan(`\n✅ Server running at: http://localhost:${PORT}`));
        console.log(chalk.yellow(`\n📱 Open your browser and go to:`));
        console.log(chalk.blue(`   http://localhost:${PORT}\n`));
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(chalk.yellow(`\n⚠️ Port ${PORT} is already in use.`));
            console.log(chalk.yellow(`Server might already be running.\n`));
            // Don't crash, just continue without starting a new server
        } else {
            console.error(chalk.red('Server error:'), err);
        }
    });
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(chalk.red('Uncaught Exception:'), err);
    if (err.code !== 'EADDRINUSE') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
});