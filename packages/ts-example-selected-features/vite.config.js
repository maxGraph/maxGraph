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

import process from 'node:process';
import { defineConfig } from 'vite';

import { analyzer } from 'vite-bundle-analyzer';

import { failOnChunkSizeExceeded } from '../../scripts/vite/chunk-size-limit.mjs';
import { maxGraphCodeSplitting } from '../../scripts/vite/maxgraph-chunk.mjs';

// The maximum size of the maxgraph chunk, in kB. Declared once and passed to both the Vite warning and the blocking
// check, so they cannot drift apart.
const chunkSizeLimitInKB = 362;

export default defineConfig(({ mode }) => {
  // The analyzer slows the build down and starts a report server, so only analyze the production bundle when
  // explicitly asked for it: see the 'build:analyze' script.
  const isBundleAnalysisEnabled = mode === 'production' && process.env.ANALYZE === 'true';

  return {
    plugins: [
      // The analyzer runs after the size check, which aborts the build, so an oversized chunk would leave no report at
      // all: exactly the case where the report is needed to find out what grew. Only one of the two is registered, and
      // the plain 'npm run build' remains the one that enforces the limit.
      ...(isBundleAnalysisEnabled
        ? [analyzer()]
        : [failOnChunkSizeExceeded(chunkSizeLimitInKB)]),
    ],
    build: {
      // The analyzer relies on the source map to report how much each module contributes to the bundle. 'hidden' emits
      // the map without appending a sourceMappingURL comment, so what gets analyzed is byte for byte what the regular
      // build produces. false is the Vite default, restated here to make the analysis-only nature explicit.
      sourcemap: isBundleAnalysisEnabled ? 'hidden' : false,
      rolldownOptions: {
        output: {
          codeSplitting: maxGraphCodeSplitting(),
        },
      },
      chunkSizeWarningLimit: chunkSizeLimitInKB,
    },
  };
});
