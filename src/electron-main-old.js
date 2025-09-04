const { app, BrowserWindow, Menu, Tray, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Disable GPU hardware acceleration to prevent errors
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

let mainWindow;
let tray;
let server;
let serverStarted = false;

// Start the web server
async function startServer() {
    if (!serverStarted) {
        try {
            require('./web-server');
            serverStarted = true;
            
            // Wait for server to actually be ready
            await new Promise(resolve => {
                const checkServer = () => {
                    http.get('http://localhost:3000/api/status', (res) => {
                        if (res.statusCode === 200) {
                            resolve();
                        } else {
                            setTimeout(checkServer, 500);
                        }
                    }).on('error', () => {
                        setTimeout(checkServer, 500);
                    });
                };
                setTimeout(checkServer, 1000);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
        }
    }
}

async function createWindow() {
    const iconPath = path.join(__dirname, '../public/icon.png');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: fs.existsSync(iconPath) ? iconPath : undefined,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // Disable GPU acceleration to avoid errors
            disableHardwareAcceleration: true
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
                <body style="font-family: Arial; padding: 50px;">
                    <h1>Failed to start web server</h1>
                    <p>Error: ${error.message}</p>
                    <p>Please restart the application.</p>
                </body>
            </html>
        `);
    }

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
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
}

function createTray() {
    try {
        const iconPath = path.join(__dirname, '../public/tray-icon.png');
        
        // Check if icon exists, if not, skip tray creation
        if (!fs.existsSync(iconPath)) {
            console.log('Tray icon not found, skipping tray creation');
            return;
        }
        
        tray = new Tray(iconPath);
        
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

app.whenReady().then(async () => {
    console.log('App ready, starting server...');
    await startServer();
    console.log('Server started, creating window...');
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
});