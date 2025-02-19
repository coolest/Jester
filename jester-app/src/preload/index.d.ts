import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electronAPI: {
      addCrypto: (cryptoData: any) => Promise<void>
    }
  }
}

export {}