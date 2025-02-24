/// <reference types="vite/client" />
interface Window {
    api: {
      addCrypto: (cryptoData: any) => Promise<any>
      getCryptos: () => Promise<any[]>
      deleteCrypto: (id: string) => Promise<any>  
    }
    electron: any
  }