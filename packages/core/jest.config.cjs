/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // preset: 'ts-jest',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom', // need to access to the browser objects
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).ts'],
};
