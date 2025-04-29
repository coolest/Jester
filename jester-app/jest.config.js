/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle module aliases (if you're using them in your project)
    '^@renderer/(.*)$': '<rootDir>/src/renderer/src/$1',
    // Handle CSS imports (with CSS modules)
    '\\.css$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/imageMock.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.web.json',
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
    // Add custom transforms for other file types if needed
    '\\.css$': '<rootDir>/__mocks__/cssTransform.js'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Tell Jest what files are tests
  testMatch: [
    "**/__tests__/**/*.(spec|test).[jt]s?(x)"
  ],
  // Explicitly exclude TypeScript declaration files and other non-test files
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/out/",
    "/__tests__/types.d.ts",
    "/__tests__/test-types.d.ts",
    "/__tests__/setupTests.js",
    "\\.d\\.ts$"
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react)/)'
  ],
  // Add coverage thresholds to match what seems to be your project's requirements
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60
    },
    "src/renderer/src/components/main/sidebar/Button.tsx": {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    },
    "src/renderer/src/components/main/sidebar/SideBar.tsx": {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    }
  },
  // Define global variables that might be expected by your code
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  // Mock all .css file imports
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Mock specific modules that might be causing issues
  moduleNameMapper: {
    "^@renderer/(.*)$": "<rootDir>/src/renderer/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/imageMock.js",
    "lucide-react": "<rootDir>/__mocks__/lucideMock.js"
  }
};