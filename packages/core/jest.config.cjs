/*
Copyright 2022-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// The type provided here could provide more guidance if it included types from @swc/jest
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  coverageReporters: ['lcov', 'text-summary'],
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'jsdom', // need to access to the browser objects
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
          },
          target: 'es2020',
        },
      },
    ],
  },
  // maxGraph imports include a "js" extension which makes jest unable to resolve the imports
  // So use this workaround to remove the ".js" extension from the module names
  // Taken from https://github.com/swc-project/jest/issues/64#issuecomment-1029753225
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
