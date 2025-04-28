interface Window {
    api: {
      addCrypto: jest.Mock<Promise<any>, [any]>
      getCryptos: jest.Mock<Promise<any[]>, []>
      deleteCrypto: jest.Mock<Promise<any>, [string]>
      getSettings: jest.Mock<Promise<any>, []>
      saveSettings: jest.Mock<Promise<any>, [any]>
      getEnvVariables: jest.Mock<Promise<any>, []>
      updateEnvFile: jest.Mock<Promise<any>, [any]>
      saveDbAuthFile: jest.Mock<Promise<any>, [any]>
      checkDbAuthExists: jest.Mock<Promise<boolean>, []>
      testRedditConnection: jest.Mock<Promise<any>, [any]>
      testTwitterConnection: jest.Mock<Promise<any>, [any]>
      testYoutubeConnection: jest.Mock<Promise<any>, [any]>
      testDatabaseConnection: jest.Mock<Promise<any>, []>
    }
  }