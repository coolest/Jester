/// <reference types="vite/client" />
interface Window {
    api: {
      addCrypto: (cryptoData: any) => Promise<any>
      getCryptos: () => Promise<any[]>
      deleteCrypto: (id: string) => Promise<any>  

      getSettings: () => Promise<any>
      saveSettings: (settings : any) => Promise<any>,
      
      // Environment variable methods
      getEnvVariables: () => Promise<any>,
      updateEnvFile: (envVars : any) => Promise<any>,
      
      // Database auth file methods
      saveDbAuthFile: (fileContent : any) => Promise<any>,
      checkDbAuthExists: () => Promise<any>,
      
      // Connection testing methods
      testRedditConnection: (credentials : any) => Promise<any>,
      testTwitterConnection: (credentials : any) => Promise<any>,
      testYoutubeConnection: (credentials : any) => Promise<any>,
      testDatabaseConnection: () => Promise<any>

      // Reports
      createReport: (reportData : any) => Promise<any>,
      getAllReports: () => Promise<any>,
      getReportById: (reportId : any) => Promise<any>,
      cancelReport: (reportId : any) => Promise<any>,
      deleteReport: (reportId : any) => Promise<any>,
      getReportLog: (reportId : any) => Promise<any>
    }

    electron: any
  }