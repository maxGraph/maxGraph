/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  coverageReporters: ['lcov', 'text-summary'],
  // preset: 'ts-jest',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom', // need to access to the browser objects
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).ts'],
};
