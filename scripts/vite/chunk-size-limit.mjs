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

import { Buffer } from 'node:buffer';

/**
 * Vite plugin that fails the build when an emitted chunk is larger than `limitInKB`.
 *
 * `build.chunkSizeWarningLimit` is warn only: Vite passes it to its native reporter, which logs the oversized chunks
 * and lets the build exit 0. A bundle regression then produces a single line in a CI log that nobody reads. See
 * https://github.com/vitejs/vite/issues/18496 for the upstream feature request.
 *
 * Pass the same value to `build.chunkSizeWarningLimit` and to this plugin, so the two thresholds cannot be set to
 * different values. Sizes are computed in kB (1000 bytes) from the generated code, which matches what
 * `scripts/build-all-examples.bash` prints.
 *
 * @param {number} limitInKB the maximum size, in kB, allowed for a single chunk.
 * @returns {import('vite').Plugin} the plugin to add to the `plugins` of a Vite configuration.
 */
export function failOnChunkSizeExceeded(limitInKB) {
  return {
    name: 'maxgraph:fail-on-chunk-size-exceeded',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk') {
          continue;
        }
        const sizeInKB = Buffer.byteLength(output.code) / 1000;
        if (sizeInKB > limitInKB) {
          this.error(
            `Chunk "${fileName}" is ${sizeInKB.toFixed(2)} kB, above the ${limitInKB} kB limit.`
          );
        }
      }
    },
  };
}
