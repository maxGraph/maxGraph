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
cd ../../packages/js-example-without-defaults/
# For more details see 'Run' below
npm run dev
```

For more build information see: [@maxgraph/core](../../README.md#development).


## Run

Run `npm run dev` from this directory and go to http://localhost:8080/

If you want to bundle the application, run `npm run build` and then run `npm run preview` to access to a preview of the bundle application.
