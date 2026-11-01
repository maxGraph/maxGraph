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

import process from 'node:process';

import { analyzer } from 'vite-bundle-analyzer';

import { failOnChunkSizeExceeded } from './chunk-size-limit.mjs';

/**
 * Returns the bundle analysis or the chunk size limit that all the Vite examples share, as the plugins and the source
 * map option to put in their configuration.
 *
 * The analysis is opt-in and production only, through the ANALYZE environment variable:
 * - 'true', set by the 'build:analyze' script, starts the report server of the analyzer, to browse the bundle;
 * - 'json' writes the same data to 'dist/bundle-analysis.json' and starts nothing, for a tool or an agent comparing
 *   two builds, such as '.claude/shared/bundle-sizes/compare-bundle-analyses.mjs'. Each module carries its
 *   'parsedSize', the bytes it occupies in the minified chunk, and an 'importedBy' list which, despite its name, holds
 *   the modules it imports.
 *
 * The analyzer runs after the size check, which aborts the build, so an oversized chunk would leave no report at all:
 * exactly the case where the report is needed to find out what grew. Only one of the two is registered, and the plain
 * 'npm run build' remains the one that enforces the limit.
 *
 * The analyzer relies on the source map to report how much each module contributes to the bundle. 'hidden' emits the
 * map without appending a sourceMappingURL comment, so what gets analyzed is byte for byte what the regular build
 * produces. false is the Vite default, restated to make the analysis-only nature explicit.
 *
 * @param {string} mode the Vite mode the configuration is resolved for.
 * @param {number} chunkSizeLimitInKB the maximum size of a chunk, in kB, also passed to 'build.chunkSizeWarningLimit'.
 * @returns {{plugins: import('vite').PluginOption[], sourcemap: boolean | 'hidden'}} the plugins to register and the
 * value of 'build.sourcemap'.
 */
export function bundleAnalysisOrSizeLimit(mode, chunkSizeLimitInKB) {
  const analysis = mode === 'production' ? process.env.ANALYZE : undefined;

  if (analysis === 'true') {
    return { plugins: [analyzer()], sourcemap: 'hidden' };
  }
  if (analysis === 'json') {
    return {
      plugins: [analyzer({ analyzerMode: 'json', fileName: 'bundle-analysis.json' })],
      sourcemap: 'hidden',
    };
  }
  return { plugins: [failOnChunkSizeExceeded(chunkSizeLimitInKB)], sourcemap: false };
}
