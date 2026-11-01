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

const { writeFileSync } = require('node:fs');
const path = require('node:path');
const { RsdoctorWebpackPlugin } = require('@rsdoctor/webpack-plugin');

/**
 * Adds to the webpack configuration of an example the bundle analysis and the size budget that all of them share.
 *
 * The analysis is opt-in and production only, through the ANALYZE environment variable:
 * - 'true', set by the 'build:analyze' script, runs Rsdoctor, which slows the build down and starts a report server,
 *   to browse the bundle;
 * - 'json' writes the modules of the bundle to 'dist/bundle-analysis.json' and starts nothing, for a tool or an agent
 *   comparing two builds, such as '.claude/shared/bundle-sizes/compare-bundle-analyses.mjs'. Each module carries the
 *   modules that import it, and its size before minification: the brief JSON report of Rsdoctor 1.6, which would give
 *   the minified size, came out with an empty module graph.
 *
 * Rsdoctor needs a source map to
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
  const analysis = isDevMode ? undefined : process.env.ANALYZE;
  const isRsdoctorEnabled = analysis === 'true';
  const isJsonAnalysisEnabled = analysis === 'json';

  return {
    ...config,
    ...(isRsdoctorEnabled ? { devtool: 'hidden-source-map' } : {}),
    plugins: (config.plugins ?? []).concat(
      isRsdoctorEnabled ? [new RsdoctorWebpackPlugin()] : [],
      isJsonAnalysisEnabled ? [writeModuleStats] : []
    ),
    performance: {
      hints: isDevMode || isRsdoctorEnabled || isJsonAnalysisEnabled ? false : 'error',
      maxAssetSize,
      maxEntrypointSize,
    },
  };
}

/**
 * Writes the modules of the bundle next to it, each with its size before minification and the modules importing it.
 *
 * It reads the module graph of the compilation rather than the webpack stats: the stats give the importers of the
 * top level modules only, while most of the modules of @maxgraph/core, published as ES modules, are concatenated by
 * webpack into a single module, and the stats list them without their importers.
 */
function writeModuleStats(compiler) {
  compiler.hooks.done.tap('maxgraph:write-module-stats', (stats) => {
    const { compilation } = stats;
    const { chunkGraph, moduleGraph, requestShortener } = compilation;
    // A concatenated module is named after its root module, followed by ' + <count> modules'
    const nameOf = (module) =>
      module.readableIdentifier(requestShortener).replace(/ \+ \d+ modules?$/, '');

    // The modules of the chunks only: compilation.modules also holds those that tree shaking left out of the bundle
    const bundledModules = new Set();
    for (const chunk of compilation.chunks) {
      for (const module of chunkGraph.getChunkModulesIterable(chunk)) {
        // A concatenated module holds the modules it was built from in 'modules'
        for (const bundledModule of module.modules ?? [module]) {
          bundledModules.add(bundledModule);
        }
      }
    }

    // The origin of a connection is the concatenated module itself when the import comes from its root module
    const isInBundle = (module) =>
      bundledModules.has(module) ||
      (module.modules ?? []).some((inner) => bundledModules.has(inner));

    const modules = [];
    for (const bundledModule of bundledModules) {
      const importers = new Set();
      for (const connection of moduleGraph.getIncomingConnections(bundledModule)) {
        // An inactive connection is an import whose exports tree shaking removed, and a module out of the bundle does
        // not keep anything in it: neither makes the origin an importer
        if (
          connection.originModule &&
          connection.getActiveState(undefined) !== false &&
          isInBundle(connection.originModule)
        ) {
          importers.add(nameOf(connection.originModule));
        }
      }
      modules.push({
        name: nameOf(bundledModule),
        size: bundledModule.size(),
        importers: [...importers],
      });
    }
    const assets = Object.entries(compilation.assets).map(([name, source]) => ({
      name,
      size: source.size(),
    }));

    writeFileSync(
      path.join(compilation.outputOptions.path, 'bundle-analysis.json'),
      JSON.stringify({ assets, modules }, null, 1)
    );
  });
}

module.exports = { withBundleAnalysisAndSizeBudget };
