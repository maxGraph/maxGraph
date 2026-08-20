# Integrate `maxGraph` in a vanilla JavaScript project built with Webpack - features selection

This example only loads the features and configuration required by the application for an efficient tree-shaking.

So, it demonstrates how to only register Shapes, Perimeters, EdgeMarkers and EdgeStyles used by the application.

It also uses the following set of features:
- Cells selection by mouse click or with Rubberband
- Management of selected cells
- Fit and zoom using buttons
- Panning with mouse drag

As in the [js-example](../js-example) example, it demonstrates how to import/decode an XML model using `Codecs`.

Note: This example should be kept in sync with the [js-example](../js-example) example as it replicates the same use case.

## Setup

From the repository root, run:
```bash
npm install
cd packages/core/
npm run build
cd ../../packages/js-example-selected-features/
# For more details see 'Run' below
npm run dev
```

For more build information see: [@maxgraph/core](../../README.md#development).


## Run

Run `npm run dev` from this directory and go to http://localhost:8080/

If you want to bundle the application, run `npm run build` and then run `npm run preview` to access to a preview of the bundle application.


## Analyze the bundle

[Rsdoctor](https://rsdoctor.rs/) is available to inspect what ends up in the bundle, which is useful to check the effect
of the tree-shaking of `maxGraph`.

Run `npm run build:analyze` from this directory. This builds in production mode with Rsdoctor enabled, then opens the
report in the browser. Press `Ctrl+C` to stop the report server.

Rsdoctor is intentionally not part of `npm run build`: it slows the build down and starts a server, so it is only
enabled by the `build:analyze` script. The report is generated locally and is never published by the CI.

The production build also enforces a size budget, see `performance` in `webpack.config.js`. The limits are the current
bundle size rounded up to the next kB, so `npm run build` fails when the bundle grows. Use `npm run build:analyze` to
find out what was added, and update the limits in `webpack.config.js` when the increase is intended.
