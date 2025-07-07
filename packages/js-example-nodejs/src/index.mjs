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

// This is needed to create a DOM environment for Node.js, required when importing from maxGraph ESM
// Must be placed before importing any maxGraph code
import 'jsdom-global/register.js';
// import directly from ESM to ensure everything works. See https://github.com/maxGraph/maxGraph/issues/827
// the shared code in the _shared.js file is CommonJS, so it is not able to detect errors in the ESM code
import { constants } from '@maxgraph/core';
import { createGraphAndExport } from './_shared.js';

console.info(`maxGraph example with Node.js using ESM of maxGraph ${constants.VERSION}`);
createGraphAndExport('ESM', 'esm');
