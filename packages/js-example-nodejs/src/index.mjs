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

// TODO this fails because the import statements in the files of the maxGraph package doesn't add the "js" file extension
// Node.js requires such extensions. This should be fixed when implementing XXX
import { BaseGraph } from '@maxgraph/core';

console.info('maxGraph example with Node.js using ESM');

const graph = new BaseGraph();
