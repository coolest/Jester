// Type definitions for Jest tests
interface Window {
  api: {
    addCrypto: jest.Mock;
    getCryptos: jest.Mock;
    deleteCrypto: jest.Mock;
    getSettings: jest.Mock;
    saveSettings: jest.Mock;
    getEnvVariables: jest.Mock;
    updateEnvFile: jest.Mock;
    saveDbAuthFile: jest.Mock;
    checkDbAuthExists: jest.Mock;
    testRedditConnection: jest.Mock;
    testTwitterConnection: jest.Mock;
    testYoutubeConnection: jest.Mock;
    testDatabaseConnection: jest.Mock;
  };
  electron: any;
}