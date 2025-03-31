import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell, ipcMain} from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// We'll initialize the store after import
let store

// Initialize store using async IIFE
;(async () => {
  const { default: ElectronStore } = await import('electron-store')
  store = new ElectronStore({
    name: 'crypto-data',
    defaults: {
      cryptos: []
    }
  })
})()

ipcMain.handle('add-crypto', async (_event, cryptoData) => {
  console.log('Main process received add-crypto request')
  try {
    if (!store) {
      throw new Error('Store not initialized')
    }

    const newCrypto = {
      id: Date.now().toString(),
      ...cryptoData,
      createdAt: new Date().toISOString()
    }

    const currentCryptos = store.get('cryptos') || []
    currentCryptos.push(newCrypto)
    store.set('cryptos', currentCryptos)

    return { success: true, data: newCrypto }
  } catch (error) {
    console.error('Error in add-crypto handler:', error)
    throw error
  }
})

ipcMain.handle('get-cryptos', () => {
  try {
    if (!store) {
      throw new Error('Store not initialized')
    }
    return store.get('cryptos') || []
  } catch (error) {
    console.error('Error getting cryptos:', error)
    return []
  }
})

ipcMain.handle('delete-crypto', (_event, id) => {
  try {
    if (!store) {
      throw new Error('Store not initialized')
    }
    const currentCryptos = store.get('cryptos') || []
    const updatedCryptos = currentCryptos.filter(crypto => crypto.id !== id)
    store.set('cryptos', updatedCryptos)
    return { success: true }
  } catch (error) {
    console.error('Error deleting crypto:', error)
    throw error
  }
})
ipcMain.handle('get-settings', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(settingsData);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

// Helper function to get path to scrape directory
function getScrapePath() {
  // Start from the directory containing the main script
  const SCRAPE_PATH = path.join(__dirname, '..', '..', '..', 'scrape');
  console.log('Scrape path:', SCRAPE_PATH);

  // This should be "jester/out/main"
  
  // Navigate up to jester root, then to scrape directory
  return SCRAPE_PATH;
}

// Environment variable management
ipcMain.handle('get-env-variables', async () => {
  try {
    // Path to .env file using the helper function
    const scrapePath = getScrapePath();
    const envPath = path.join(scrapePath, '.env');
    
    console.log('Loading .env from path:', envPath);
    
    if (fs.existsSync(envPath)) {
      // Read and parse .env file
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = dotenv.parse(envContent);
      return envVars;
    }
    
    return {};
  } catch (error) {
    console.error('Error getting env variables:', error);
    throw error;
  }
});

ipcMain.handle('update-env-file', async (event, envVars) => {
  try {
    // Path to .env file using the helper function
    const scrapePath = getScrapePath();
    const envPath = path.join(scrapePath, '.env');
    
    console.log('Saving .env to path:', envPath);
    
    // Format env vars into string
    let envContent = '';
    for (const [key, value] of Object.entries(envVars)) {
      envContent += `${key}=${value}\n`;
    }
    
    // Write to .env file
    fs.writeFileSync(envPath, envContent);
    
    return true;
  } catch (error) {
    console.error('Error updating env file:', error);
    throw error;
  }
});

// Database auth file management
ipcMain.handle('save-db-auth-file', async (event, fileContent) => {
  try {
    // Path to db_auth.json file using the helper function
    const scrapePath = getScrapePath();
    const dbAuthPath = path.join(scrapePath, 'db_auth.json');
    
    console.log('Saving db_auth.json to path:', dbAuthPath);
    
    // Save file
    fs.writeFileSync(dbAuthPath, fileContent);
    
    return true;
  } catch (error) {
    console.error('Error saving db auth file:', error);
    throw error;
  }
});

ipcMain.handle('check-db-auth-exists', async () => {
  try {
    // Path to db_auth.json file using the helper function
    const scrapePath = getScrapePath();
    const dbAuthPath = path.join(scrapePath, 'db_auth.json');
    
    return fs.existsSync(dbAuthPath);
  } catch (error) {
    console.error('Error checking db auth file existence:', error);
    throw error;
  }
});

// Connection testing
ipcMain.handle('test-reddit-connection', async (event, credentials) => {
  return new Promise((resolve, reject) => {
    // Save credentials to a temporary env file
    const tempEnvPath = path.join(app.getPath('temp'), 'reddit-test.env');
    const envContent = `
      REDDIT_CLIENT_ID=${credentials.clientId}
      REDDIT_CLIENT_SECRET=${credentials.clientSecret}
      REDDIT_USERNAME=${credentials.username}
      REDDIT_PASSWORD=${credentials.password}
    `;
    
    fs.writeFileSync(tempEnvPath, envContent);
    
    // Run a test script that uses these credentials using the helper function
    const scrapePath = getScrapePath();
    const testScript = path.join(scrapePath, 'test-reddit-connection.js');
    
    exec(`node ${testScript} --env-file=${tempEnvPath}`, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempEnvPath);
      } catch (e) {
        console.error('Error deleting temporary env file:', e);
      }
      
      if (error) {
        console.error(`Error testing Reddit connection: ${error.message}`);
        reject(error.message);
        return;
      }
      
      if (stderr) {
        console.error(`Error in test script: ${stderr}`);
        reject(stderr);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
});

ipcMain.handle('test-twitter-connection', async (event, credentials) => {
  return new Promise((resolve, reject) => {
    // Save credentials to a temporary env file
    const tempEnvPath = path.join(app.getPath('temp'), 'twitter-test.env');
    const envContent = `
      X_API_KEY=${credentials.apiKey}
      X_API_KEY_SECRET=${credentials.apiKeySecret}
      X_ACCESS_TOKEN=${credentials.accessToken}
      X_ACCESS_TOKEN_SECRET=${credentials.accessTokenSecret}
    `;
    
    fs.writeFileSync(tempEnvPath, envContent);
    
    // Run a test script that uses these credentials using the helper function
    const scrapePath = getScrapePath();
    const testScript = path.join(scrapePath, 'test-twitter-connection.js');
    
    exec(`node ${testScript} --env-file=${tempEnvPath}`, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempEnvPath);
      } catch (e) {
        console.error('Error deleting temporary env file:', e);
      }
      
      if (error) {
        console.error(`Error testing Twitter connection: ${error.message}`);
        reject(error.message);
        return;
      }
      
      if (stderr) {
        console.error(`Error in test script: ${stderr}`);
        reject(stderr);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
});

ipcMain.handle('test-youtube-connection', async (event, credentials) => {
  return new Promise((resolve, reject) => {
    // Save credentials to a temporary env file
    const tempEnvPath = path.join(app.getPath('temp'), 'youtube-test.env');
    const envContent = `YT_KEY=${credentials.apiKey}`;
    
    fs.writeFileSync(tempEnvPath, envContent);
    
    // Run a test script that uses these credentials using the helper function
    const scrapePath = getScrapePath();
    const testScript = path.join(scrapePath, 'test-youtube-connection.js');
    
    exec(`node ${testScript} --env-file=${tempEnvPath}`, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempEnvPath);
      } catch (e) {
        console.error('Error deleting temporary env file:', e);
      }
      
      if (error) {
        console.error(`Error testing YouTube connection: ${error.message}`);
        reject(error.message);
        return;
      }
      
      if (stderr) {
        console.error(`Error in test script: ${stderr}`);
        reject(stderr);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
});

ipcMain.handle('test-database-connection', async () => {
  return new Promise((resolve, reject) => {
    // Run a test script that uses the db_auth.json file using the helper function
    const scrapePath = getScrapePath();
    const testScript = path.join(scrapePath, 'test-database-connection.js');
    
    exec(`node ${testScript}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error testing database connection: ${error.message}`);
        reject(error.message);
        return;
      }
      
      if (stderr) {
        console.error(`Error in test script: ${stderr}`);
        reject(stderr);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
});

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,

    minWidth: 600,
    minHeight: 447,

    show: false,
    autoHideMenuBar: true,
    center: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    ...(process.platform !== 'darwin' ? { icon } : {}),
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    titleBarOverlay: {
      color: '#100f14',
      symbolColor: '#bdbdbd',
      height: 35
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize store first
  const { default: ElectronStore } = await import('electron-store')
  store = new ElectronStore({
    name: 'crypto-data',
    defaults: {
      cryptos: []
    }
  })

  // Then continue with the rest
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
