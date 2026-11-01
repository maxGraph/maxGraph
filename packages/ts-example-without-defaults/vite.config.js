/*
Copyright 2024-present The maxGraph project Contributors

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

import { defineConfig } from 'vite';

import { bundleAnalysisOrSizeLimit } from '../../scripts/vite/bundle-analysis.mjs';
import { maxGraphCodeSplitting } from '../../scripts/vite/maxgraph-chunk.mjs';

// The maximum size of the maxgraph chunk, in kB. Declared once and passed to both the Vite warning and the blocking
// check, so they cannot drift apart.
const chunkSizeLimitInKB = 220;

export default defineConfig(({ mode }) => {
  // The analysis only runs when explicitly asked for, see 'build:analyze' and the documentation of the helper
  const { plugins, sourcemap } = bundleAnalysisOrSizeLimit(mode, chunkSizeLimitInKB);

  return {
    plugins,
    build: {
      sourcemap,
      rolldownOptions: {
        output: {
          codeSplitting: maxGraphCodeSplitting(),
        },
      },
      chunkSizeWarningLimit: chunkSizeLimitInKB,
    },
  };
});
