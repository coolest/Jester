import '@testing-library/jest-dom';

// Mock the Electron window.api
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
};

// Create common test utilities for use across tests
global.mockCryptoData = [
  { 
    id: '1', 
    cryptoName: 'Bitcoin', 
    subreddit: 'bitcoin', 
    hashtag: 'BTC', 
    score: 65,
    videoLink: 'https://youtube.com/watch?v=abc123',
    img: 'null'
  },
  { 
    id: '2', 
    cryptoName: 'Ethereum', 
    subreddit: 'ethereum', 
    hashtag: 'ETH', 
    score: 55,
    videoLink: 'https://youtube.com/watch?v=def456',
    img: 'null'
  }
];

// Create reusable mock implementation for API functions
window.api.getCryptos.mockImplementation(() => Promise.resolve(global.mockCryptoData));
window.api.addCrypto.mockImplementation((crypto) => {
  const newCrypto = { ...crypto, id: Math.random().toString(36).substring(7) };
  global.mockCryptoData.push(newCrypto);
  return Promise.resolve(newCrypto);
});
window.api.deleteCrypto.mockImplementation((id) => {
  global.mockCryptoData = global.mockCryptoData.filter(crypto => crypto.id !== id);
  return Promise.resolve({ success: true });
});

// Add support for ResizeObserver which is used in some components but not available in JSDOM
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};
