import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getCryptos: () => ipcRenderer.invoke('get-cryptos'),
  addCrypto: (crypto) => ipcRenderer.invoke('add-crypto', crypto),
  deleteCrypto: (id) => ipcRenderer.invoke('delete-crypto', id),
  
  // New methods for settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Environment variable methods
  getEnvVariables: () => ipcRenderer.invoke('get-env-variables'),
  updateEnvFile: (envVars) => ipcRenderer.invoke('update-env-file', envVars),
  
  // Database auth file methods
  saveDbAuthFile: (fileContent) => ipcRenderer.invoke('save-db-auth-file', fileContent),
  checkDbAuthExists: () => ipcRenderer.invoke('check-db-auth-exists'),
  
  // Connection testing methods
  testRedditConnection: (credentials) => ipcRenderer.invoke('test-reddit-connection', credentials),
  testTwitterConnection: (credentials) => ipcRenderer.invoke('test-twitter-connection', credentials),
  testYoutubeConnection: (credentials) => ipcRenderer.invoke('test-youtube-connection', credentials),
  testDatabaseConnection: () => ipcRenderer.invoke('test-database-connection')
}

console.log('Preload script running')
console.log('API being exposed:', api)

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in browser')
}

try {
  console.log('Preload script running')
  console.log('API being exposed:', api)

  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)

  console.log('API exposed successfully')
} catch (error) {
  console.error('Error in preload script:', error)
}