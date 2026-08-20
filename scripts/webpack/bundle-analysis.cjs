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

const process = require('node:process');
const { RsdoctorWebpackPlugin } = require('@rsdoctor/webpack-plugin');

/**
 * Adds to the webpack configuration of an example the bundle analysis and the size budget that all of them share.
 *
 * The analysis is opt-in and production only: Rsdoctor slows the build down and starts a report server, so it is
 * enabled by the 'build:analyze' script through the ANALYZE environment variable. Rsdoctor needs a source map to
 * attribute the bytes of the minified bundle to individual modules, which is what the 'Parsed Size' of a module is;
 * 'hidden-source-map' emits that map without adding a sourceMappingURL comment to the bundle, so what gets analyzed
 * stays byte for byte what the regular build produces. The key is only set when analyzing, to keep the webpack defaults
 * everywhere else, in particular the source maps of the dev server.
 *
 * The budget fails the production build when the bundle grows, which is the signal that something new was pulled in.
 * Development bundles are not minified, so nothing is enforced there, and an analyze run is a diagnostic: reporting a
 * size error there would only add noise to the very report that was asked for to understand the size.
 *
 * @param {{isDevMode: boolean, maxAssetSize: number, maxEntrypointSize: number}} budget the sizes are in bytes, and
 * each one is the smallest value that passes, that is the current size rounded up to the next kB.
 * @param {object} config the configuration of the example.
 * @returns {object} that configuration, with the analysis and the budget added.
 */
function withBundleAnalysisAndSizeBudget(
  { isDevMode, maxAssetSize, maxEntrypointSize },
  config
) {
  const isBundleAnalysisEnabled = !isDevMode && process.env.ANALYZE === 'true';

  return {
    ...config,
    ...(isBundleAnalysisEnabled ? { devtool: 'hidden-source-map' } : {}),
    plugins: (config.plugins ?? []).concat(
      isBundleAnalysisEnabled ? [new RsdoctorWebpackPlugin()] : []
    ),
    performance: {
      hints: isDevMode || isBundleAnalysisEnabled ? false : 'error',
      maxAssetSize,
      maxEntrypointSize,
    },
  };
}

module.exports = { withBundleAnalysisAndSizeBudget };
