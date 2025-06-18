module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!jest.config.js',
    '!example*.js',
    '!**/*.test.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};