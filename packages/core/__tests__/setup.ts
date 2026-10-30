/*
Copyright 2026-present The maxGraph project Contributors

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

import { afterEach } from '@jest/globals';
import { destroyCreatedGraphs } from './utils';

// Runs before every test file, see `setupFilesAfterEnv` in jest.config.cjs. Tearing the graphs down here rather than in
// each file means a test never inherits the graphs of the ones that ran before it.
//
// This assumes the tests of a file run one after the other, which is what Jest does unless a test opts out with
// `test.concurrent`. The registry this hook drains is module state shared by the whole file, so with concurrent tests
// it would destroy a graph another test is still using. Running test *files* in parallel is fine, each worker gets its
// own module registry and its own jsdom.
afterEach(destroyCreatedGraphs);
