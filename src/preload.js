const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// selected Node.js and Electron APIs without exposing everything
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    }
});