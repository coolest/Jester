export const mockWindowApi = () => {
    window.api = {
      addCrypto: jest.fn(),
      getCryptos: jest.fn(),
      deleteCrypto: jest.fn(),
      getSettings: jest.fn(),
      saveSettings: jest.fn(),
      getEnvVariables: jest.fn(),
      updateEnvFile: jest.fn(),
      saveDbAuthFile: jest.fn(),
      checkDbAuthExists: jest.fn(),
      testRedditConnection: jest.fn(),
      testTwitterConnection: jest.fn(),
      testYoutubeConnection: jest.fn(),
      testDatabaseConnection: jest.fn(),
      getAllReports: jest.fn().mockResolvedValue({
        success: true,
        reports: [
          { timestamp: 1714050000, reddit: 50, twitter: 60, youtube: 40 },
          { timestamp: 1714100000, reddit: 55, twitter: 65, youtube: 45 }
        ]
      }),
      getReportById: jest.fn(),
      createReport: jest.fn(),
    };
  };
  