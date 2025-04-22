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
