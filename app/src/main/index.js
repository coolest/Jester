const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Load the initial page (Add Crypto)
    mainWindow.loadFile(path.join(__dirname, '../pages/addCrypto/addCrypto.html'));
    
    // Open DevTools for debugging
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle navigation between pages
ipcMain.on('navigate', (event, page) => {
    console.log('Navigating to:', page);
    const filePath = path.join(__dirname, `../pages/${page}/${page}.html`);
    console.log('File path:', filePath);
    mainWindow.loadFile(filePath);
});