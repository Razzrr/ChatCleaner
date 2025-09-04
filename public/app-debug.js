// Debug wrapper for error tracking
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.message, 'at', e.filename, ':', e.lineno, ':', e.colno);
    console.error('Stack:', e.error ? e.error.stack : 'No stack trace');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// Check if Socket.IO is loaded
if (typeof io === 'undefined') {
    console.error('Socket.IO is not loaded! Make sure socket.io.js is included.');
}

// Socket.IO connection with error handling
let socket = null;
try {
    socket = io();
    console.log('Socket.IO connected successfully');
} catch (error) {
    console.error('Failed to initialize Socket.IO:', error);
}

// State management
let currentUser = null;
let selectedServer = null;
let selectedChannel = null;
let isDeleting = false;
let isPaused = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    // Check for required elements
    const requiredElements = [
        'authSection', 'mainSection', 'userInfo', 'username', 
        'userAvatar', 'serverList', 'channelList', 'dmList',
        'messagePreview', 'progressSection', 'statusBar', 'loadingOverlay'
    ];
    
    let missingElements = [];
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('Missing required HTML elements:', missingElements);
    }
    
    try {
        checkAuthentication();
        setupSocketListeners();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Socket event listeners with error handling
function setupSocketListeners() {
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }
    
    socket.on('connect', () => {
        console.log('Socket connected');
        showStatus('Connected to server', 'success');
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
        showStatus('Disconnected from server', 'error');
    });

    socket.on('authenticated', (user) => {
        console.log('User authenticated:', user);
        currentUser = user;
        showMainInterface(user);
        loadServers();
        loadDMs();
    });

    socket.on('status', (data) => {
        showStatus(data.message, data.type);
    });

    socket.on('servers', (servers) => {
        console.log('Received servers:', servers);
        window.lastServers = servers;
        displayServers(servers);
    });

    socket.on('channels', (channels) => {
        console.log('Received channels:', channels);
        displayChannels(channels);
    });

    socket.on('dms', (dms) => {
        console.log('Received DMs:', dms);
        window.lastDMs = dms;
        displayDMs(dms);
    });

    socket.on('message-preview', (preview) => {
        displayMessagePreview(preview);
    });

    socket.on('message-deleted', (data) => {
        updateDeletionProgress(data);
    });

    socket.on('deletion-complete', (data) => {
        completeDeletion(data);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
        showStatus(error, 'error');
        hideLoading();
    });

    socket.on('logged-out', () => {
        currentUser = null;
        showAuthInterface();
    });
}

// Authentication functions with error handling
function checkAuthentication() {
    if (!socket) {
        console.error('Cannot check auth - socket not initialized');
        return;
    }
    socket.emit('check-auth');
}

function authenticate(method) {
    if (!socket) {
        console.error('Cannot authenticate - socket not initialized');
        return;
    }
    showLoading('Authenticating...');
    socket.emit('authenticate', { method });
}

// Safe DOM manipulation functions
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with ID '${id}' not found`);
    }
    return element;
}

function showMainInterface(user) {
    const authSection = safeGetElement('authSection');
    const mainSection = safeGetElement('mainSection');
    const userInfo = safeGetElement('userInfo');
    
    if (authSection) authSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'block';
    if (userInfo) userInfo.style.display = 'flex';
    
    const username = safeGetElement('username');
    const userAvatar = safeGetElement('userAvatar');
    
    if (username) username.textContent = user.username;
    if (userAvatar) {
        userAvatar.src = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
}

function showAuthInterface() {
    const authSection = safeGetElement('authSection');
    const mainSection = safeGetElement('mainSection');
    const userInfo = safeGetElement('userInfo');
    
    if (authSection) authSection.style.display = 'block';
    if (mainSection) mainSection.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
}

function showStatus(message, type = 'info') {
    console.log(`Status [${type}]:`, message);
    const statusBar = safeGetElement('statusBar');
    if (!statusBar) return;
    
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
    
    statusBar.appendChild(statusDiv);
    
    setTimeout(() => {
        if (statusBar.contains(statusDiv)) {
            statusBar.removeChild(statusDiv);
        }
    }, 5000);
}

function showLoading(text = 'Loading...') {
    const overlay = safeGetElement('loadingOverlay');
    const loadingText = safeGetElement('loadingText');
    
    if (overlay) overlay.style.display = 'flex';
    if (loadingText) loadingText.textContent = text;
}

function hideLoading() {
    const overlay = safeGetElement('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Stub functions for missing features
function loadServers() {
    if (!socket) {
        console.error('Cannot load servers - socket not initialized');
        return;
    }
    socket.emit('get-servers');
}

function loadDMs() {
    if (!socket) {
        console.error('Cannot load DMs - socket not initialized');
        return;
    }
    socket.emit('get-dms');
}

function displayServers(servers) {
    const serverList = safeGetElement('serverList');
    if (!serverList) return;
    
    serverList.innerHTML = '';
    servers.forEach(server => {
        const div = document.createElement('div');
        div.className = 'server-item';
        div.textContent = server.name;
        div.onclick = () => selectServer(server.id);
        serverList.appendChild(div);
    });
}

function displayChannels(channels) {
    const channelList = safeGetElement('channelList');
    if (!channelList) return;
    
    channelList.innerHTML = '';
    channels.forEach(channel => {
        const div = document.createElement('div');
        div.className = 'channel-item';
        div.textContent = '#' + channel.name;
        div.onclick = () => selectChannel(channel.id);
        channelList.appendChild(div);
    });
}

function displayDMs(dms) {
    const dmList = safeGetElement('dmList');
    if (!dmList) return;
    
    dmList.innerHTML = '';
    dms.forEach(dm => {
        const div = document.createElement('div');
        div.className = 'dm-item';
        div.textContent = dm.recipient ? dm.recipient.username : 'Unknown User';
        div.onclick = () => selectChannel(dm.id);
        dmList.appendChild(div);
    });
}

function displayMessagePreview(preview) {
    console.log('Displaying message preview:', preview);
    // Implementation needed
}

function updateDeletionProgress(data) {
    console.log('Updating deletion progress:', data);
    // Implementation needed
}

function completeDeletion(data) {
    console.log('Deletion complete:', data);
    showStatus(`Deleted ${data.deleted} messages`, 'success');
    hideLoading();
}

function selectServer(serverId) {
    selectedServer = serverId;
    if (socket) {
        socket.emit('get-channels', { serverId });
    }
}

function selectChannel(channelId) {
    selectedChannel = channelId;
    if (socket) {
        socket.emit('get-messages', { channelId });
    }
}

// Additional safe functions for forms
function showCredentialsForm() {
    hideAuthForms();
    const form = safeGetElement('credentialsForm');
    if (form) form.style.display = 'block';
}

function showTokenForm() {
    hideAuthForms();
    const form = safeGetElement('tokenForm');
    if (form) form.style.display = 'block';
}

function hideAuthForms() {
    const credForm = safeGetElement('credentialsForm');
    const tokenForm = safeGetElement('tokenForm');
    
    if (credForm) credForm.style.display = 'none';
    if (tokenForm) tokenForm.style.display = 'none';
}

function loginWithCredentials() {
    const email = safeGetElement('email');
    const password = safeGetElement('password');
    
    if (!email || !password) {
        console.error('Email or password field not found');
        return;
    }
    
    if (!email.value || !password.value) {
        showStatus('Please enter email and password', 'error');
        return;
    }
    
    if (socket) {
        showLoading('Logging in...');
        socket.emit('authenticate', {
            method: 'credentials',
            credentials: { 
                email: email.value, 
                password: password.value 
            }
        });
    }
}

function loginWithToken() {
    const token = safeGetElement('token');
    
    if (!token) {
        console.error('Token field not found');
        return;
    }
    
    if (!token.value) {
        showStatus('Please enter a token', 'error');
        return;
    }
    
    if (socket) {
        showLoading('Validating token...');
        socket.emit('authenticate', {
            method: 'token',
            credentials: { token: token.value }
        });
    }
}

function logout() {
    if (socket) {
        socket.emit('logout');
    }
    currentUser = null;
    showAuthInterface();
}

// Tab switching
function switchTab(tab) {
    const serversTab = safeGetElement('serversTab');
    const dmsTab = safeGetElement('dmsTab');
    
    if (tab === 'servers') {
        if (serversTab) serversTab.style.display = 'block';
        if (dmsTab) dmsTab.style.display = 'none';
    } else {
        if (serversTab) serversTab.style.display = 'none';
        if (dmsTab) dmsTab.style.display = 'block';
    }
}

console.log('App-debug.js loaded successfully');