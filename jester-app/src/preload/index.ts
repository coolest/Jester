import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  addCrypto: (cryptoData: any) => ipcRenderer.invoke('add-crypto', cryptoData),
  getCryptos: () => ipcRenderer.invoke('get-cryptos'),
  deleteCrypto: (id: string) => ipcRenderer.invoke('delete-crypto', id)
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