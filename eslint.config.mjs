/*
Copyright 2025-present The maxGraph project Contributors

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

import eslintJs from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import prettierRecommendedConfig from 'eslint-plugin-prettier/recommended';
import unicornPlugin from 'eslint-plugin-unicorn';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    ignores: [
      '.github/*',
      '.idea/*',
      '.vscode/*',
      '**/dist/**',
      '**/lib/**',
      '**/node_modules/**',
      'packages/core/build/**',
      'packages/core/coverage/**',
      'packages/html/stashed/**',
      'packages/website/build/**',
      'packages/website/generated/**',
    ],
  },

  eslintJs.configs.recommended,

  // disable type-aware linting on JS files
  {
    files: ['**/*.{js,cjs,mjs}'],
    ...tsEslint.configs.disableTypeChecked,
    languageOptions: {
      ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
      sourceType: 'module', // Allows for the use of imports
    },
  },

  // typescript
  tsEslint.configs.recommended,

  // TODO configure import with more rules by adding "importPlugin.flatConfigs.recommended"
  {
    plugins: {
      import: importPlugin, // may no longer be needed whe loading recommended config of import plugin
    },
    rules: {
      'no-misleading-character-class': 'warn',
      'no-dupe-else-if': 'warn',
      'no-warning-comments': 'off', // we have to many TODO/FIXME and they overwhelm the reports
      'import/no-absolute-path': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-duplicate-enum-values': 'off', // check the impact of changing enum values if we want to enable this
      '@typescript-eslint/no-unsafe-function-type': 'off', // will be managed later
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      'no-restricted-syntax': [
        'error',
        // ban const enums
        {
          selector: 'TSEnumDeclaration[const=true]',
          message:
            'Const enums are forbidden to increase interoperability. Use regular enums instead.',
        },
      ],
      'no-console': 'error',
      'no-eval': 'error',
    },
  },

  {
    files: ['packages/core/src/**/*'],
    ...nodePlugin.configs['flat/recommended-script'],
    plugins: {
      n: nodePlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      ...nodePlugin.configs['flat/recommended-script'].rules, // without this line, the rules are not applied when specifying custom rules
      'n/file-extension-in-import': ['error', 'always'],
      'n/no-unsupported-features/node-builtins': 'off', // we don't use node in this package, and most errors are due to "navigator.xxx is still an experimental feature and is not supported until Node.js yyy"
      // apply a subset of unicorn rules for now
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-switch': 'error',
    },
  },

  prettierRecommendedConfig // Enables eslint-plugin-prettier, eslint-config-prettier and prettier/prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration.
);
