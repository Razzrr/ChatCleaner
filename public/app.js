// Socket.IO connection
const socket = io();

// State management
let currentUser = null;
let selectedServer = null;
let selectedChannel = null;
let isDeleting = false;
let isPaused = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupSocketListeners();
});

// Socket event listeners
function setupSocketListeners() {
    socket.on('connect', () => {
        showStatus('Connected to server', 'success');
    });

    socket.on('disconnect', () => {
        showStatus('Disconnected from server', 'error');
    });

    socket.on('authenticated', (user) => {
        currentUser = user;
        showMainInterface(user);
        loadServers();
        loadDMs();
    });

    socket.on('status', (data) => {
        showStatus(data.message, data.type);
    });

    socket.on('servers', (servers) => {
        window.lastServers = servers; // Store for nuclear selection
        displayServers(servers);
    });

    socket.on('channels', (channels) => {
        displayChannels(channels);
    });

    socket.on('dms', (dms) => {
        window.lastDMs = dms; // Store for nuclear selection
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
        showStatus(error, 'error');
        hideLoading();
    });

    socket.on('logged-out', () => {
        currentUser = null;
        showAuthInterface();
    });
}

// Authentication
function checkAuthentication() {
    socket.emit('check-auth');
}

function authenticate(method) {
    showLoading('Authenticating...');
    socket.emit('authenticate', { method });
}

function showCredentialsForm() {
    hideAuthForms();
    document.getElementById('credentialsForm').style.display = 'block';
}

function showTokenForm() {
    hideAuthForms();
    document.getElementById('tokenForm').style.display = 'block';
}

function hideAuthForms() {
    document.getElementById('credentialsForm').style.display = 'none';
    document.getElementById('tokenForm').style.display = 'none';
}

function loginWithCredentials() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showStatus('Please enter email and password', 'error');
        return;
    }
    
    showLoading('Logging in...');
    socket.emit('authenticate', {
        method: 'credentials',
        credentials: { email, password }
    });
    hideAuthForms();
}

function loginWithToken() {
    const token = document.getElementById('token').value;
    
    if (!token) {
        showStatus('Please enter a token', 'error');
        return;
    }
    
    showLoading('Validating token...');
    socket.emit('authenticate', {
        method: 'token',
        credentials: { token }
    });
    hideAuthForms();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        socket.emit('logout');
    }
}

// Interface management
function showMainInterface(user) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
    document.getElementById('userInfo').style.display = 'flex';
    
    document.getElementById('username').textContent = `${user.username}#${user.discriminator}`;
    if (user.avatar) {
        document.getElementById('userAvatar').src = user.avatar;
    }
    
    hideLoading();
    showStatus('Successfully authenticated!', 'success');
}

function showAuthInterface() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainSection').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}

// Tab switching
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
    
    if (tab === 'servers') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('serversTab').style.display = 'block';
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('dmsTab').style.display = 'block';
    }
}

// Server/Channel management
function loadServers() {
    socket.emit('get-servers');
}

function loadDMs() {
    socket.emit('get-dms');
}

function displayServers(servers) {
    const serverList = document.getElementById('serverList');
    serverList.innerHTML = '';
    
    servers.forEach(server => {
        const serverEl = document.createElement('div');
        serverEl.className = 'server-item';
        serverEl.onclick = () => selectServer(server);
        
        serverEl.innerHTML = `
            ${server.icon ? `<img src="${server.icon}" alt="${server.name}">` : '<span>📁</span>'}
            <div>
                <div style="font-weight: 600">${server.name}</div>
                <div style="font-size: 12px; color: #666">${server.memberCount} members</div>
            </div>
        `;
        
        serverList.appendChild(serverEl);
    });
}

function selectServer(server) {
    selectedServer = server;
    selectedChannel = null;
    
    document.querySelectorAll('.server-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    document.getElementById('serverList').style.display = 'none';
    document.getElementById('channelList').style.display = 'block';
    
    socket.emit('get-channels', server.id);
}

function displayChannels(channels) {
    const channelList = document.getElementById('channelList');
    channelList.innerHTML = '<button class="btn-secondary" onclick="backToServers()" style="margin-bottom: 15px">← Back to Servers</button>';
    
    channels.forEach(channel => {
        const channelEl = document.createElement('div');
        channelEl.className = 'channel-item';
        channelEl.onclick = () => selectChannel(channel);
        
        channelEl.innerHTML = `
            <span># ${channel.name}</span>
        `;
        
        channelList.appendChild(channelEl);
    });
}

function backToServers() {
    document.getElementById('serverList').style.display = 'block';
    document.getElementById('channelList').style.display = 'none';
    selectedServer = null;
    selectedChannel = null;
}

function selectChannel(channel) {
    selectedChannel = channel;

    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('selected');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('selected');
    }

    // Send just the channel ID to match backend expectation
    socket.emit('preview-messages', channel.id);
    showLoading('Loading messages...');
}

function displayDMs(dms) {
    const dmList = document.getElementById('dmList');
    dmList.innerHTML = '';
    
    if (dms.length === 0) {
        dmList.innerHTML = '<p style="text-align: center; color: #666">No direct messages found</p>';
        return;
    }
    
    dms.forEach(dm => {
        const dmEl = document.createElement('div');
        dmEl.className = 'dm-item';
        dmEl.onclick = () => selectDM(dm);

        // Handle both old and new username formats
        const username = dm.username || 'Unknown User';
        const discriminator = dm.discriminator || '0000';

        dmEl.innerHTML = `
            ${dm.avatar ? `<img src="${dm.avatar}" alt="${username}">` : '<span>👤</span>'}
            <span>${username}${discriminator !== '0' ? '#' + discriminator : ''}</span>
        `;

        dmList.appendChild(dmEl);
    });
}

function selectDM(dm) {
    selectedChannel = dm;
    
    document.querySelectorAll('.dm-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    socket.emit('preview-messages', dm.id);
    showLoading('Loading messages...');
}

// Message preview and deletion
function displayMessagePreview(preview) {
    hideLoading();
    
    const previewSection = document.getElementById('messagePreview');
    previewSection.style.display = 'block';
    document.getElementById('progressSection').style.display = 'none';
    
    document.getElementById('totalMessages').textContent = preview.total;
    document.getElementById('deleteCount').max = preview.total;
    document.getElementById('deleteCount').value = Math.min(10, preview.total);
    
    const previewList = document.getElementById('previewList');
    previewList.innerHTML = '';
    
    if (preview.preview.length === 0) {
        previewList.innerHTML = '<p style="text-align: center; color: #666">No messages found</p>';
        return;
    }
    
    preview.preview.forEach(msg => {
        const msgEl = document.createElement('div');
        msgEl.className = 'message-item';
        
        const date = new Date(msg.timestamp);
        msgEl.innerHTML = `
            <div class="timestamp">${date.toLocaleString()}</div>
            <div class="content">${msg.content || '[No text content]'}</div>
            ${msg.attachments > 0 ? `<div style="font-size: 12px; color: #666">📎 ${msg.attachments} attachment(s)</div>` : ''}
        `;
        
        previewList.appendChild(msgEl);
    });
}

function startDeletion() {
    if (isDeleting) {
        showStatus('Already deleting messages', 'warning');
        return;
    }
    
    const count = parseInt(document.getElementById('deleteCount').value);
    const mode = document.querySelector('input[name="mode"]:checked').value;
    
    if (!selectedChannel) {
        showStatus('Please select a channel', 'error');
        return;
    }
    
    if (count <= 0) {
        showStatus('Please enter a valid number', 'error');
        return;
    }
    
    const dryRun = mode === 'dryrun';
    const confirmMsg = dryRun 
        ? `This will simulate deleting ${count} messages. Continue?`
        : `⚠️ This will permanently delete ${count} messages. This cannot be undone! Continue?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    isDeleting = true;
    isPaused = false;
    document.getElementById('messagePreview').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('logContainer').innerHTML = '';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('pauseBtn').textContent = '⏸️ Pause';
    
    socket.emit('delete-messages', {
        channelId: selectedChannel.id,
        count: count,
        dryRun: dryRun,
        deleteAll: false
    });
}

function deleteAllMessages() {
    if (isDeleting) {
        showStatus('Already deleting messages', 'warning');
        return;
    }
    
    const mode = document.querySelector('input[name="mode"]:checked').value;
    
    if (!selectedChannel) {
        showStatus('Please select a channel', 'error');
        return;
    }
    
    const dryRun = mode === 'dryrun';
    const confirmMsg = dryRun 
        ? `This will simulate deleting ALL your messages in this channel. Continue?`
        : `⚠️⚠️⚠️ DANGER: This will permanently delete ALL your messages in this channel! This CANNOT be undone! Are you absolutely sure?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    if (!dryRun) {
        const doubleConfirm = prompt('Type "DELETE ALL" to confirm you want to delete ALL messages:');
        if (doubleConfirm !== 'DELETE ALL') {
            showStatus('Deletion cancelled', 'info');
            return;
        }
    }
    
    isDeleting = true;
    isPaused = false;
    document.getElementById('messagePreview').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('logContainer').innerHTML = '';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('pauseBtn').textContent = '⏸️ Pause';
    
    socket.emit('delete-messages', {
        channelId: selectedChannel.id,
        count: 999999,
        dryRun: dryRun,
        deleteAll: true
    });
}

function togglePause() {
    if (!isDeleting) return;
    
    isPaused = !isPaused;
    const btn = document.getElementById('pauseBtn');
    
    if (isPaused) {
        socket.emit('pause-deletion');
        btn.textContent = '▶️ Resume';
        showStatus('Deletion paused', 'info');
    } else {
        socket.emit('resume-deletion');
        btn.textContent = '⏸️ Pause';
        showStatus('Deletion resumed', 'info');
    }
}

function stopDeletion() {
    if (!isDeleting) return;
    
    if (confirm('Are you sure you want to stop the deletion process?')) {
        socket.emit('stop-deletion');
        showStatus('Stopping deletion...', 'warning');
    }
}

function updateDeletionProgress(data) {
    const progress = (data.current / data.total) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${data.current} / ${data.total} messages ${data.dryRun ? 'simulated' : 'deleted'}`;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `${data.dryRun ? '[DRY RUN] ' : ''}Deleted message ${data.current}: "${data.content}..."`;
    document.getElementById('logContainer').appendChild(logEntry);
    
    // Auto-scroll log
    const logContainer = document.getElementById('logContainer');
    logContainer.scrollTop = logContainer.scrollHeight;
}

function completeDeletion(data) {
    isDeleting = false;
    document.getElementById('progressFill').style.width = '100%';
    
    const message = data.dryRun 
        ? `Dry run complete! Would have deleted ${data.deleted} messages.`
        : `Successfully deleted ${data.deleted} messages!`;
    
    showStatus(message, 'success');
    
    // Refresh preview after deletion
    if (selectedChannel && !data.dryRun) {
        setTimeout(() => {
            socket.emit('preview-messages', selectedChannel.id);
        }, 2000);
    }
}

// Nuclear delete function
async function nuclearDelete() {
    showLoading('Loading servers and DMs...');
    
    // Get list of servers and DMs
    socket.emit('get-servers');
    socket.emit('get-dms');
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    hideLoading();
    
    // Create selection interface
    const selectionModal = document.createElement('div');
    selectionModal.className = 'nuclear-selection-modal';
    selectionModal.innerHTML = `
        <div class="nuclear-selection-content">
            <h2>☢️ NUCLEAR DELETE - SELECT TARGETS ☢️</h2>
            
            <div class="nuclear-selection-controls">
                <button onclick="selectAllNuclear(true)">✅ Select All</button>
                <button onclick="selectAllNuclear(false)">❌ Deselect All</button>
                <button onclick="selectAllServers(true)">📁 All Servers</button>
                <button onclick="selectAllServers(false)">📁 No Servers</button>
                <button onclick="selectAllDMs(true)">💬 All DMs</button>
                <button onclick="selectAllDMs(false)">💬 No DMs</button>
            </div>
            
            <div class="nuclear-selection-grid">
                <div class="nuclear-selection-column">
                    <h3>📁 SERVERS</h3>
                    <div id="nuclearServerList" class="nuclear-selection-list"></div>
                </div>
                <div class="nuclear-selection-column">
                    <h3>💬 DIRECT MESSAGES</h3>
                    <div id="nuclearDMList" class="nuclear-selection-list"></div>
                </div>
            </div>
            
            <div class="nuclear-selection-buttons">
                <button class="btn-danger-nuclear" onclick="confirmNuclearDelete()">
                    ☢️ DELETE FROM SELECTED
                </button>
                <button class="btn-cancel" onclick="cancelNuclearDelete()">
                    ❌ CANCEL
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(selectionModal);
    
    // Populate servers
    populateNuclearServers();
    populateNuclearDMs();
}

// Populate server list for nuclear selection
function populateNuclearServers() {
    const serverList = document.getElementById('nuclearServerList');
    if (!window.lastServers) return;
    
    serverList.innerHTML = '';
    window.lastServers.forEach(server => {
        const item = document.createElement('label');
        item.className = 'nuclear-selection-item';
        item.innerHTML = `
            <input type="checkbox" value="${server.id}" checked>
            <span>${server.name}</span>
            <small>${server.memberCount} members</small>
        `;
        serverList.appendChild(item);
    });
}

// Populate DM list for nuclear selection
function populateNuclearDMs() {
    const dmList = document.getElementById('nuclearDMList');
    if (!window.lastDMs) return;
    
    dmList.innerHTML = '';
    window.lastDMs.forEach(dm => {
        const item = document.createElement('label');
        item.className = 'nuclear-selection-item';
        item.innerHTML = `
            <input type="checkbox" value="${dm.id}" checked>
            <span>${dm.username}#${dm.discriminator}</span>
        `;
        dmList.appendChild(item);
    });
}

// Select/deselect all
function selectAllNuclear(select) {
    document.querySelectorAll('.nuclear-selection-item input').forEach(cb => {
        cb.checked = select;
    });
}

function selectAllServers(select) {
    document.querySelectorAll('#nuclearServerList input').forEach(cb => {
        cb.checked = select;
    });
}

function selectAllDMs(select) {
    document.querySelectorAll('#nuclearDMList input').forEach(cb => {
        cb.checked = select;
    });
}

// Cancel nuclear delete
function cancelNuclearDelete() {
    document.querySelector('.nuclear-selection-modal').remove();
    showStatus('Nuclear delete cancelled', 'info');
}

// Confirm and start nuclear delete with selections
function confirmNuclearDelete() {
    // Get selected servers and DMs
    const selectedServers = [];
    const selectedDMs = [];
    
    document.querySelectorAll('#nuclearServerList input:checked').forEach(cb => {
        selectedServers.push(cb.value);
    });
    
    document.querySelectorAll('#nuclearDMList input:checked').forEach(cb => {
        selectedDMs.push(cb.value);
    });
    
    if (selectedServers.length === 0 && selectedDMs.length === 0) {
        alert('No servers or DMs selected!');
        return;
    }
    
    const warning = `
☢️☢️☢️ NUCLEAR DELETE WARNING ☢️☢️☢️

This will DELETE ALL YOUR MESSAGES from:
• ${selectedServers.length} selected servers
• ${selectedDMs.length} selected DMs

This process:
• Cannot be undone
• Will take a VERY long time
• May trigger rate limits

Are you ABSOLUTELY SURE?`;
    
    if (!confirm(warning)) {
        return;
    }
    
    const confirmation = prompt('Type "NUKE SELECTED" to confirm deletion:');
    if (confirmation !== 'NUKE SELECTED') {
        showStatus('Nuclear delete cancelled', 'info');
        return;
    }
    
    // Remove selection modal
    document.querySelector('.nuclear-selection-modal').remove();
    
    showStatus('🔥 NUCLEAR DELETE INITIATED - THIS WILL TAKE A LONG TIME', 'warning');
    
    // Hide normal UI and show nuclear progress
    document.getElementById('mainSection').style.display = 'none';
    document.getElementById('authSection').style.display = 'none';
    
    // Create nuclear progress display
    const nuclearDisplay = document.createElement('div');
    nuclearDisplay.id = 'nuclearProgress';
    nuclearDisplay.className = 'nuclear-progress';
    nuclearDisplay.innerHTML = `
        <h2>☢️ NUCLEAR DELETE IN PROGRESS ☢️</h2>
        <div class="nuclear-stats">
            <div>Total Deleted: <span id="nuclearTotal">0</span></div>
            <div>Current Location: <span id="nuclearLocation">Starting...</span></div>
        </div>
        <div class="nuclear-log" id="nuclearLog"></div>
        <button class="btn-stop" onclick="stopDeletion()">⏹️ EMERGENCY STOP</button>
    `;
    document.querySelector('.container').appendChild(nuclearDisplay);
    
    // Send nuclear delete with selections
    socket.emit('nuclear-delete', {
        servers: selectedServers,
        dms: selectedDMs
    });
}

// Nuclear progress handlers
socket.on('nuclear-progress', (data) => {
    const locationEl = document.getElementById('nuclearLocation');
    const logEl = document.getElementById('nuclearLog');
    
    if (data.type === 'server') {
        locationEl.textContent = `Server ${data.current}/${data.total}: ${data.name}`;
    } else if (data.type === 'channel') {
        locationEl.textContent = `${data.server} > #${data.channel}`;
    } else if (data.type === 'dm') {
        locationEl.textContent = `DM ${data.current}/${data.total}: ${data.name}`;
    } else if (data.type === 'deleted') {
        document.getElementById('nuclearTotal').textContent = data.total;
        const logEntry = document.createElement('div');
        logEntry.className = 'nuclear-entry';
        logEntry.textContent = `✓ Deleted ${data.count} from ${data.location}`;
        logEl.insertBefore(logEntry, logEl.firstChild);
        if (logEl.children.length > 10) {
            logEl.removeChild(logEl.lastChild);
        }
    }
});

socket.on('nuclear-log', (message) => {
    const logEl = document.getElementById('nuclearLog');
    if (logEl) {
        const logEntry = document.createElement('div');
        logEntry.className = 'nuclear-entry';
        if (message.includes('Skipped') || message.includes('error') || message.includes('Failed')) {
            logEntry.className += ' error';
            logEntry.textContent = `⚠️ ${message}`;
        } else {
            logEntry.textContent = message;
        }
        logEl.insertBefore(logEntry, logEl.firstChild);
        if (logEl.children.length > 20) {
            logEl.removeChild(logEl.lastChild);
        }
    }
});

socket.on('nuclear-status', (message) => {
    const statusEl = document.getElementById('nuclearStatus');
    if (statusEl) {
        statusEl.textContent = message;
    }
    showStatus(message, 'info');
});

socket.on('nuclear-complete', (results) => {
    showStatus(`Nuclear delete complete! Deleted ${results.totalDeleted} messages total`, 'success');
    
    const summary = document.createElement('div');
    summary.className = 'nuclear-summary';
    summary.innerHTML = `
        <h3>Nuclear Delete Complete</h3>
        <p>Total Messages Deleted: ${results.totalDeleted}</p>
        <p>Servers Cleaned: ${results.servers.length}</p>
        <p>DMs Cleaned: ${results.dms.length}</p>
        ${results.errors.length > 0 ? `<p>Errors: ${results.errors.length}</p>` : ''}
        <button onclick="location.reload()">Refresh Interface</button>
    `;
    document.getElementById('nuclearProgress').appendChild(summary);
});

// Utility functions
function showLoading(text = 'Loading...') {
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.getElementById('loadingText').textContent = text;
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showStatus(message, type = 'info') {
    const statusBar = document.getElementById('statusBar');
    statusBar.textContent = message;
    statusBar.className = `status-bar show ${type}`;
    
    setTimeout(() => {
        statusBar.classList.remove('show');
    }, 5000);
}