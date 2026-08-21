# Integrate `maxGraph` without defaults in a vanilla JavaScript project built with Webpack

Demonstrate how to integrate `maxGraph` without loading defaults:
- plugins
- styles
- shapes
- perimeters
- connectors
- markers

Note: This example should be kept in sync with the [ts-example-without-defaults](../ts-example-without-defaults) example.

## Setup

From the repository root, run:
```bash
npm install
cd packages/core/
npm run build
cd ../../packages/js-example-without-defaults/
# For more details see 'Run' below
npm run dev
```

For more build information see: [@maxgraph/core](../../README.md#development).


## Run

Run `npm run dev` from this directory and go to http://localhost:8080/

If you want to bundle the application, run `npm run build` and then run `npm run preview` to access to a preview of the bundle application.


## Analyze the bundle

[Rsdoctor](https://rsdoctor.rs/) is available to inspect what ends up in the bundle, which is useful to check that the
tree-shaking of `maxGraph` behaves as expected.

Run `npm run build:analyze` from this directory. This builds in production mode with Rsdoctor enabled, then opens the
report in the browser. Press `Ctrl+C` to stop the report server.

Rsdoctor is intentionally not part of `npm run build`: it slows the build down and starts a server, so it is only
enabled by the `build:analyze` script. The report is generated locally and is never published by the CI.

The production build also enforces a size budget, see the limits passed to `withBundleAnalysisAndSizeBudget` at the
bottom of `webpack.config.js`. They are the current bundle size rounded up to the next kB, so `npm run build` fails when
the bundle grows, which usually means that defaults are no longer tree-shaken. Use `npm run build:analyze` to find out
what was added, and update the limits when the increase is intended.