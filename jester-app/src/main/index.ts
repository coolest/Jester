import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell, ipcMain} from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

// Define the type for our crypto data
interface CryptoData {
  id: string
  cryptoName: string
  videoLink: string
  subreddit: string
  hashtag: string
  score: number
  img?: string
  createdAt: string
}

// We'll initialize the store after import
let store: any

// Initialize store using async IIFE
(async () => {
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

    const newCrypto: CryptoData = {
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

ipcMain.handle('delete-crypto', (_event, id: string) => {
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

function createWindow(): void {
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
