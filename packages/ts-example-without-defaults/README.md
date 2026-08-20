# Integrate `maxGraph` without defaults in a vanilla TypeScript project built with Vite

Demonstrate how to integrate `maxGraph` without loading defaults:
  - plugins
  - styles
  - shapes
  - perimeters
  - connectors
  - markers

Note: This example should be kept in sync with the [js-example-without-defaults](../js-example-without-defaults) example.

Initialized from https://github.com/vitejs/vite/tree/v2.9.8/packages/create-vite/template-vanilla-ts

## Setup

Initialize all packages
> From the repository root, run `npm install`.
 
Build maxgraph@core
> From the `packages/core` directory, run `npm run build`.

## Run

Run `npm run dev` and go to http://localhost:5173/

If you want to bundle the application, run `npm run build` and then run `npm run preview` to access to a preview of the
bundle application.

## Analyze the bundle

[vite-bundle-analyzer](https://github.com/nonzzz/vite-bundle-analyzer) is available to inspect what ends up in the
bundle, which is useful to check that the tree-shaking of `maxGraph` behaves as expected.

Run `npm run build:analyze` from this directory. This builds in production mode with the analyzer enabled, then opens
the report in the browser. Press `Ctrl+C` to stop the report server.

The analyzer is intentionally not part of `npm run build`: it slows the build down and starts a server, so it is only
enabled by the `build:analyze` script. The report is generated locally and is never published by the CI.

The production build also enforces a size limit, declared once at the top of `vite.config.js` and checked against every
emitted chunk. In practice the `maxgraph` chunk is the one that sets it, being by far the largest. Vite only logs a
warning when a chunk exceeds `chunkSizeWarningLimit`, so the same limit is passed to a shared plugin that turns it into
an error: `npm run build` fails when a chunk grows, which usually means that defaults are no longer tree-shaken. The
limit is the current size of that chunk rounded up to the next kB. Use `npm run build:analyze` to find out what was
added, and update it when the increase is intended.