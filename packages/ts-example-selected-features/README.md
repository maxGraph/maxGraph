# Integrate `maxGraph` in a vanilla TypeScript project built with Vite

Demonstrate how to use `BaseGraph` with a set of features to demonstrate how to perform effective tree-shaking when using `maxGraph`.
- use `BaseGraph` instead of `Graph` to not include some defaults: default plugins and default style registration
- features: Cells selection (with mouse click and RubberBand), panning, zooming and fit center using buttons
- styles: only register Shapes, Perimeters, EdgeMarkers and EdgeStyles used by the application

Note: This example should be kept in sync with the [js-example-selected-features](../js-example-selected-features) example.

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
