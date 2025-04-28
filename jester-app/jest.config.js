module.exports = {
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@renderer/(.*)$': '<rootDir>/src/renderer/src/$1',
    },
    testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
    transform: {
      '^.+\\.[jt]sx?$': 'babel-jest',
    },
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.js'],
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/__tests__/',
    ],
    collectCoverageFrom: [
      'src/renderer/src/components/**/*.{js,jsx,ts,tsx}',
      'src/renderer/src/utils/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
    ],
  };