# Bundle Size Budgets

Applies to the size guards of the example packages, whichever bundler they use. Each example declares its own limits,
while the machinery enforcing them is shared:

- webpack: the values are passed to `withBundleAnalysisAndSizeBudget` in `packages/*-example*/webpack.config.js`, and
  `scripts/webpack/bundle-analysis.cjs` turns them into the `performance` section,
- vite: the value is the `chunkSizeLimitInKB` constant of `packages/*-example*/vite.config.js`, fed to both
  `build.chunkSizeWarningLimit` and the `failOnChunkSizeExceeded` plugin of `scripts/vite/chunk-size-limit.mjs`.

The rule for choosing the value is the same for every example. What differs between the two bundlers is the unit, what
the value is compared against, and what makes the build fail.

## Round the limits up to the next kB

The limit is the **smallest value that makes the check pass**, that is the measured size rounded up to the next multiple
of 1000. Never write the exact byte count, and never add margin on top of the rounding.

```javascript
// Good, webpack: current build is 239 112 B for the asset and 240 095 B for the entrypoint
module.exports = withBundleAnalysisAndSizeBudget(
  { isDevMode, maxAssetSize: 240_000, maxEntrypointSize: 241_000 },
  config
);

// Good, vite: current maxgraph chunk is 220 859 B
const chunkSizeLimitInKB = 221;

// Bad, exact byte counts
{ isDevMode, maxAssetSize: 239_112, maxEntrypointSize: 240_095 },
```

The point of these limits is to **follow the size evolution**, not to leave room to grow into. Rounding exists so the
values stay readable and comparable with the table printed by `scripts/build-all-examples.bash`, so the headroom it
happens to leave is incidental: anywhere between 1 B and 999 B depending on where the current size falls in its kB.

That is accepted, with its consequence: an increase of 50 B can fail the build while an increase of 700 B passes
unnoticed. Choosing a wider margin would not remove that asymmetry, it would only move the boundary further away and
delay the moment the growth becomes visible. When a build does fail, check that the increase is intended, then update
the value in the same commit rather than padding it.

Use kB (1000 bytes), not KiB (1024), to stay consistent with `scripts/build-all-examples.bash`, which reports sizes
divided by 1000. Note that webpack prints KiB in its own output, so convert before rounding.

## Mind the unit: bytes for webpack, kB for vite

`maxAssetSize` and `maxEntrypointSize` are expressed in **bytes**, so use a numeric separator to keep them readable:
`240_000`. Vite's `chunkSizeWarningLimit` is expressed in **kB**, so the same budget reads `240`, not `240_000`. Writing
bytes there silently disables the guard, since no chunk is ever 240 000 kB.

## Which size feeds which limit

- webpack `maxAssetSize` is checked against **each emitted file** taken individually, so it comes from the largest one.
  Source maps are excluded by webpack's default `assetFilter`, nothing else is.
- webpack `maxEntrypointSize` is checked against the **sum of the files needed to load one entry**, typically the
  JavaScript bundle plus the extracted CSS. Files emitted outside any entry, such as a favicon copied by
  `CopyWebpackPlugin` or an image referenced from the CSS, are not counted.
- vite compares the limit against **each emitted chunk** individually. The examples isolate `@maxgraph/core` in a
  dedicated `maxgraph` chunk, which is by far the largest, so that chunk is what sets the value.

The two webpack limits therefore differ from each other, and they are not interchangeable.

## Where the guard applies

`npm run build` is the command that enforces a budget, and it is the one the CI runs. Neither bundler enforces anything
during a development build, since those bundles are not minified and are several times larger, nor during an analyze
run, which is a diagnostic: failing it would suppress the very report needed to understand the size.

webpack fails the build on its own, so `scripts/webpack/bundle-analysis.cjs` keeps `hints` at `'error'` only when
neither exemption applies, `isDevMode || isBundleAnalysisEnabled ? false : 'error'`.

Vite does not. `chunkSizeWarningLimit` only makes it log a warning, and the build still exits 0, so a regression ends up
as one line in a CI log that nobody reads. `scripts/vite/chunk-size-limit.mjs` therefore fails the build and names the
chunk and both sizes. Declare the limit once, in a `chunkSizeLimitInKB` constant, and pass it to both
`chunkSizeWarningLimit` and the plugin, so the warning and the error can never drift apart. That plugin is registered
instead of the analyzer, never alongside it: the analyzer is a post plugin, so the guard's error would abort the build
before any report is written.

## Updating a budget

When an increase is intended, rebuild, read the new size, round up to the next kB and update the value in the same
commit as the change that caused it, explaining in the commit body why the bundle grew. `npm run build:analyze`, which
every bundled example provides, shows what was added.
