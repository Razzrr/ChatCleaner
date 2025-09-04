// Modern Discord Chat Cleaner - Enhanced JavaScript
let socket;
let currentUser = null;
let isDeleting = false;
let isPaused = false;
let selectedChannel = null;
let selectedServer = null;
let deletionStats = {
    total: 0,
    deleted: 0,
    failed: 0
};

// Initialize WebSocket connection
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        showToast('Connected to server', 'success');
        checkAuthStatus();
    });
    
    socket.on('disconnect', () => {
        showToast('Disconnected from server', 'error');
    });
    
    socket.on('auth-result', handleAuthResult);
    socket.on('auth-error', handleAuthError);
    socket.on('status', handleStatus);
    socket.on('servers-list', handleServersList);
    socket.on('channels-list', handleChannelsList);
    socket.on('dms-list', handleDMsList);
    socket.on('messages-preview', handleMessagesPreview);
    socket.on('delete-progress', handleDeleteProgress);
    socket.on('delete-complete', handleDeleteComplete);
    socket.on('nuclear-progress', handleNuclearProgress);
    socket.on('nuclear-complete', handleNuclearComplete);
    socket.on('error', handleError);
}

// Theme Management
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme icon
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    
    showToast(`Switched to ${newTheme} mode`, 'success');
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    }
}

// Authentication Functions
function checkAuthStatus() {
    socket.emit('check-auth');
}

function authenticate(method) {
    showLoading('Authenticating...');
    socket.emit('authenticate', { method });
}

function showCredentialsForm() {
    hideAuthForms();
    const form = document.getElementById('credentialsForm');
    form.style.display = 'block';
    form.classList.add('show');
    document.getElementById('email').focus();
}

function showTokenForm() {
    hideAuthForms();
    const form = document.getElementById('tokenForm');
    form.style.display = 'block';
    form.classList.add('show');
    document.getElementById('token').focus();
}

function hideAuthForms() {
    document.querySelectorAll('.auth-form-modal').forEach(form => {
        form.classList.remove('show');
        setTimeout(() => {
            form.style.display = 'none';
        }, 300);
    });
}

function loginWithCredentials() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }
    
    showLoading('Logging in...');
    socket.emit('authenticate', {
        method: 'credentials',
        credentials: { email, password }
    });
}

function loginWithToken() {
    const token = document.getElementById('token').value;
    
    if (!token) {
        showToast('Please enter a token', 'error');
        return;
    }
    
    showLoading('Validating token...');
    socket.emit('authenticate', {
        method: 'token',
        credentials: { token }
    });
}

function handleAuthResult(data) {
    hideLoading();
    
    if (data.success) {
        currentUser = data.user;
        updateUserInfo();
        showMainSection();
        loadUserData();
        showToast(`Welcome back, ${currentUser.username}!`, 'success');
    } else {
        showToast('Authentication failed', 'error');
    }
}

function handleAuthError(error) {
    hideLoading();
    showToast(error.message || 'Authentication failed', 'error');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        socket.emit('logout');
        currentUser = null;
        showAuthSection();
        showToast('Logged out successfully', 'success');
    }
}

// UI State Management
function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainSection').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}

function showMainSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
    document.getElementById('userInfo').style.display = 'flex';
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('username').textContent = currentUser.username;
        
        const avatarUrl = currentUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
            
        document.getElementById('userAvatar').src = avatarUrl;
    }
}

// Data Loading
function loadUserData() {
    socket.emit('get-servers');
    socket.emit('get-dms');
    updateStats();
}

function updateStats() {
    // These would be updated based on actual data
    document.getElementById('totalServers').textContent = '0';
    document.getElementById('totalDMs').textContent = '0';
    document.getElementById('totalDeleted').textContent = deletionStats.deleted;
}

// Tab Management
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${tab}Tab`);
    });
}

// Server/Channel Management
function handleServersList(servers) {
    const serverList = document.getElementById('serverList');
    serverList.innerHTML = '';
    
    document.getElementById('totalServers').textContent = servers.length;
    
    servers.forEach(server => {
        const serverItem = createServerItem(server);
        serverList.appendChild(serverItem);
    });
}

function createServerItem(server) {
    const div = document.createElement('div');
    div.className = 'list-item server-item';
    div.dataset.serverId = server.id;
    
    const icon = server.icon 
        ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`
        : null;
    
    div.innerHTML = `
        <div class="item-icon">
            ${icon ? `<img src="${icon}" alt="${server.name}">` : server.name.charAt(0)}
        </div>
        <div class="item-info">
            <div class="item-name">${server.name}</div>
            <div class="item-meta">${server.memberCount || 0} members</div>
        </div>
        <div class="item-action">
            <button class="btn-small" onclick="selectServer('${server.id}')">
                Select →
            </button>
        </div>
    `;
    
    return div;
}

function selectServer(serverId) {
    selectedServer = serverId;
    socket.emit('get-channels', { serverId });
    showToast('Loading channels...', 'info');
}

function handleChannelsList(data) {
    const channelList = document.getElementById('channelListItems');
    channelList.innerHTML = '';
    
    document.getElementById('selectedServerName').textContent = data.serverName;
    document.getElementById('serverList').style.display = 'none';
    document.getElementById('channelList').style.display = 'block';
    
    data.channels.forEach(channel => {
        const channelItem = createChannelItem(channel);
        channelList.appendChild(channelItem);
    });
}

function createChannelItem(channel) {
    const div = document.createElement('div');
    div.className = 'list-item channel-item';
    div.dataset.channelId = channel.id;
    
    div.innerHTML = `
        <div class="item-icon">#</div>
        <div class="item-info">
            <div class="item-name">${channel.name}</div>
            <div class="item-meta">${channel.type === 0 ? 'Text' : 'Voice'} channel</div>
        </div>
        <div class="item-action">
            <button class="btn-small btn-primary" onclick="selectChannel('${channel.id}')">
                View Messages
            </button>
        </div>
    `;
    
    return div;
}

function backToServers() {
    document.getElementById('serverList').style.display = 'block';
    document.getElementById('channelList').style.display = 'none';
    selectedServer = null;
}

function selectChannel(channelId) {
    selectedChannel = channelId;
    socket.emit('get-messages', { channelId });
    showMessagePreview();
}

// DM Management
function handleDMsList(dms) {
    const dmList = document.getElementById('dmList');
    dmList.innerHTML = '';
    
    document.getElementById('totalDMs').textContent = dms.length;
    
    dms.forEach(dm => {
        const dmItem = createDMItem(dm);
        dmList.appendChild(dmItem);
    });
}

function createDMItem(dm) {
    const div = document.createElement('div');
    div.className = 'list-item dm-item';
    div.dataset.dmId = dm.id;
    
    const recipient = dm.recipient || {};
    const avatarUrl = recipient.avatar 
        ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    div.innerHTML = `
        <div class="item-icon">
            <img src="${avatarUrl}" alt="${recipient.username}">
        </div>
        <div class="item-info">
            <div class="item-name">${recipient.username || 'Unknown User'}</div>
            <div class="item-meta">Direct Message</div>
        </div>
        <div class="item-action">
            <button class="btn-small btn-primary" onclick="selectChannel('${dm.id}')">
                View Messages
            </button>
        </div>
    `;
    
    return div;
}

// Message Preview
function showMessagePreview() {
    document.getElementById('welcomeState').style.display = 'none';
    document.getElementById('messagePreview').style.display = 'block';
    document.getElementById('progressSection').style.display = 'none';
}

function handleMessagesPreview(data) {
    const previewList = document.getElementById('previewList');
    previewList.innerHTML = '';
    
    document.getElementById('messageCount').textContent = data.messages.length;
    document.getElementById('previewTitle').textContent = data.channelName || 'Messages';
    
    if (data.messages.length === 0) {
        previewList.innerHTML = '<div class="empty-state">No messages found</div>';
        return;
    }
    
    data.messages.forEach(message => {
        const messageItem = createMessageItem(message);
        previewList.appendChild(messageItem);
    });
}

function createMessageItem(message) {
    const div = document.createElement('div');
    div.className = 'message-item';
    
    const date = new Date(message.createdAt);
    const timeString = date.toLocaleString();
    
    div.innerHTML = `
        <div class="message-header">
            <span class="message-author">${message.author.username}</span>
            <span class="message-time">${timeString}</span>
        </div>
        <div class="message-content">${escapeHtml(message.content)}</div>
    `;
    
    return div;
}

// Deletion Functions
function startDeletion() {
    if (!selectedChannel) {
        showToast('Please select a channel first', 'error');
        return;
    }
    
    const count = document.getElementById('deleteCount').value;
    const mode = document.getElementById('modeSelector').value;
    
    if (mode === 'dryrun') {
        showToast('Dry run mode - no messages will be deleted', 'info');
    }
    
    socket.emit('delete-messages', {
        channelId: selectedChannel,
        limit: parseInt(count),
        mode: mode
    });
    
    showProgressSection();
}

function confirmDeleteAll() {
    if (confirm('Are you sure you want to delete ALL messages in this channel? This cannot be undone!')) {
        socket.emit('delete-messages', {
            channelId: selectedChannel,
            limit: -1, // -1 means all
            mode: document.getElementById('modeSelector').value
        });
        
        showProgressSection();
    }
}

function showProgressSection() {
    document.getElementById('messagePreview').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    isDeleting = true;
}

function handleDeleteProgress(data) {
    const progress = (data.current / data.total) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressCurrent').textContent = data.current;
    document.getElementById('progressTotal').textContent = data.total;
    
    // Add to activity log
    addActivityLog(`Deleted message ${data.current} of ${data.total}`, 'success');
}

function handleDeleteComplete(data) {
    isDeleting = false;
    deletionStats.deleted += data.deleted;
    updateStats();
    
    showToast(`Successfully deleted ${data.deleted} messages!`, 'success');
    
    // Return to message preview
    setTimeout(() => {
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('messagePreview').style.display = 'block';
        socket.emit('get-messages', { channelId: selectedChannel });
    }, 2000);
}

function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (isPaused) {
        socket.emit('pause-deletion');
        pauseBtn.textContent = 'Resume';
        pauseBtn.classList.add('paused');
        showToast('Deletion paused', 'warning');
    } else {
        socket.emit('resume-deletion');
        pauseBtn.textContent = 'Pause';
        pauseBtn.classList.remove('paused');
        showToast('Deletion resumed', 'success');
    }
}

function stopDeletion() {
    if (confirm('Stop the deletion process?')) {
        socket.emit('stop-deletion');
        isDeleting = false;
        showToast('Deletion stopped', 'warning');
    }
}

// Nuclear Delete
function showNuclearConfirm() {
    document.getElementById('nuclearModal').style.display = 'flex';
    document.getElementById('nuclearConfirm').value = '';
}

function hideNuclearConfirm() {
    document.getElementById('nuclearModal').style.display = 'none';
}

function executeNuclearDelete() {
    const confirmation = document.getElementById('nuclearConfirm').value;
    
    if (confirmation !== 'DELETE EVERYTHING') {
        showToast('Please type "DELETE EVERYTHING" to confirm', 'error');
        return;
    }
    
    hideNuclearConfirm();
    socket.emit('nuclear-delete');
    showProgressSection();
    showToast('Nuclear delete initiated...', 'warning');
}

function handleNuclearProgress(data) {
    document.getElementById('progressStatus').textContent = data.status;
    addActivityLog(data.message, data.type || 'info');
}

function handleNuclearComplete(data) {
    showToast(`Nuclear delete complete! Deleted ${data.totalDeleted} messages`, 'success');
    deletionStats.deleted += data.totalDeleted;
    updateStats();
}

// Search Functionality
function searchItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    const items = document.querySelectorAll(`#${activeTab}Tab .list-item`);
    
    items.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
}

// Activity Log
function addActivityLog(message, type = 'info') {
    const log = document.getElementById('activityLog');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;
    
    const icon = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    }[type];
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.remove('toast-enter'), 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('toast-leave');
        setTimeout(() => container.removeChild(toast), 300);
    }, 4000);
}

// Loading Overlay
function showLoading(text = 'Loading...') {
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.getElementById('loadingText').textContent = text;
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Error Handler
function handleError(error) {
    console.error('Error:', error);
    showToast(error.message || 'An error occurred', 'error');
    hideLoading();
}

function handleStatus(status) {
    if (status.message) {
        showToast(status.message, status.type || 'info');
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        hideAuthForms();
        hideNuclearConfirm();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initializeSocket();
    
    // Check if we have a saved session
    const savedToken = localStorage.getItem('discord_token');
    if (savedToken) {
        showLoading('Restoring session...');
        socket.emit('authenticate', {
            method: 'token',
            credentials: { token: savedToken }
        });
    }
});

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});