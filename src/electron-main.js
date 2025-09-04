const { app, BrowserWindow, Menu, Tray, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

// Disable GPU hardware acceleration to prevent errors
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

let mainWindow;
let tray;
let serverProcess = null;
let serverStarted = false;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('Another instance is already running. Exiting...');
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, focus our window instead
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// Start the web server in a separate process
async function startServer() {
    if (serverStarted) {
        console.log('Server already started');
        return;
    }

    return new Promise((resolve) => {
        // First check if port is already in use
        const testServer = http.createServer();
        
        testServer.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log('Port 3000 already in use, assuming server is running');
                serverStarted = true;
                resolve();
            } else {
                console.error('Test server error:', err);
                resolve();
            }
        });

        testServer.once('listening', () => {
            // Port is free, close test server and start real server
            testServer.close(() => {
                try {
                    // Start server in same process (safer for Electron)
                    require('./web-server');
                    serverStarted = true;
                    console.log('Web server started successfully');
                    
                    // Wait a bit for server to fully initialize
                    setTimeout(resolve, 1000);
                } catch (error) {
                    console.error('Failed to start web server:', error);
                    resolve(); // Continue anyway
                }
            });
        });

        testServer.listen(3000);
    });
}

async function createWindow() {
    const iconPath = path.join(__dirname, '../public/icon.png');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: fs.existsSync(iconPath) ? iconPath : undefined,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
        title: 'Discord Chat Cleaner',
        show: false
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Load the web interface
    try {
        console.log('Loading URL: http://localhost:3000');
        await mainWindow.loadURL('http://localhost:3000');
        console.log('Successfully loaded web interface');
    } catch (error) {
        console.error('Failed to load URL:', error);
        // Show error in window
        mainWindow.loadURL(`data:text/html,
            <html>
                <body style="font-family: Arial; padding: 50px; background: #1a1a1a; color: white;">
                    <h1>Failed to load application</h1>
                    <p>Error: ${error.message}</p>
                    <p>Please try restarting the application.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #5865f2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Retry
                    </button>
                </body>
            </html>
        `);
    }

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Prevent external navigation
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith('http://localhost:3000')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    // Handle new window requests
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

function createTray() {
    try {
        const iconPath = path.join(__dirname, '../public/tray-icon.png');
        
        if (!fs.existsSync(iconPath)) {
            console.log('Tray icon not found, skipping tray creation');
            return;
        }
        
        try {
            tray = new Tray(iconPath);
        } catch (trayError) {
            console.log('Could not create tray with icon, skipping tray');
            return;
        }
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show App',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                    }
                }
            },
            {
                label: 'Quit',
                click: () => {
                    app.quit();
                }
            }
        ]);
        
        tray.setToolTip('Discord Chat Cleaner');
        tray.setContextMenu(contextMenu);
        
        tray.on('click', () => {
            if (mainWindow) {
                mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
            }
        });
    } catch (error) {
        console.error('Failed to create tray:', error);
    }
}

// App event handlers
app.whenReady().then(async () => {
    console.log('App ready, starting server...');
    
    try {
        await startServer();
        console.log('Server started, creating window...');
    } catch (error) {
        console.error('Server startup error:', error);
    }
    
    await createWindow();
    createTray();

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // Clean up
    if (tray) {
        tray.destroy();
    }
    if (serverProcess) {
        serverProcess.kill();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (error.code === 'EADDRINUSE') {
        console.log('Port already in use, continuing...');
    } else if (mainWindow) {
        mainWindow.loadURL(`data:text/html,
            <html>
                <body style="font-family: Arial; padding: 50px; background: #1a1a1a; color: white;">
                    <h1>Application Error</h1>
                    <p>An unexpected error occurred:</p>
                    <pre style="background: #2a2a2a; padding: 15px; border-radius: 5px;">${error.stack || error.message}</pre>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #5865f2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Restart Application
                    </button>
                </body>
            </html>
        `);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});