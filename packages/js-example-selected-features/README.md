# Integrate `maxGraph` without defaults in a vanilla JavaScript project built with Webpack

Demonstrate how to use `BaseGraph` with a set of features to demonstrate how to perform effective tree-shaking when using `maxGraph`.
- use `BaseGraph` instead of `Graph` to not include some defaults: default plugins and default style registration
- features: Cells selection (with mouse click and RubberBand), panning, zooming and fit center using buttons
- styles: only register Shapes, Perimeters, EdgeMarkers and EdgeStyles used by the application

Note: This example should be kept in sync with the [ts-example-selected-features](../ts-example-selected-features) example.

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
