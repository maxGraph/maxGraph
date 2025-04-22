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
