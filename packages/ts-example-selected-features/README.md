# Integrate `maxGraph` in a vanilla TypeScript project built with Vite - features selection

This example only loads the features and configuration required by the application for an efficient tree-shaking.

So, it demonstrates how to only register Shapes, Perimeters, EdgeMarkers and EdgeStyles used by the application. 

It also uses the following set of features:
- Cells selection by mouse click or with Rubberband
- Management of selected cells
- Fit and zoom using buttons
- Panning with mouse drag

Note: This example should be kept in sync with the [ts-example](../ts-example) example as it replicates the same use case.

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
bundle, which is useful to check the effect of the tree-shaking of `maxGraph`.

Run `npm run build:analyze` from this directory. This builds in production mode with the analyzer enabled, then opens
the report in the browser. Press `Ctrl+C` to stop the report server.

The analyzer is intentionally not part of `npm run build`: it slows the build down and starts a server, so it is only
enabled by the `build:analyze` script. The report is generated locally and is never published by the CI.

The production build also enforces a size limit on the `maxgraph` chunk, declared once at the top of `vite.config.js`.
Vite only logs a warning when a chunk exceeds `chunkSizeWarningLimit`, so the same limit is passed to a shared plugin
that turns it into an error: `npm run build` fails when the chunk grows. The limit is the current size rounded up to the
next kB. Use `npm run build:analyze` to find out what was added, and update it when the increase is intended.
