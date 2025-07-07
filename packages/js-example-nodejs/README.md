# Integrate `maxGraph` in a headless environment with Node.js

Demonstrate how to integrate maxGraph with Node.js to use it in a headless environment.

In this example, `jsdom` is used to provide an implementation of the browser objects whose `maxGraph` depends on.
These objects are not provided by Node.js.

The example provides a script using CommonJS and another one using ESM.
- Contents: creates a Graph, exports its model to an XML file and to an SVG file.
- They use same shared code to perform the operations.

## Setup

Initialize all packages
> From the repository root, run `npm install`.

Build maxgraph@core
> From the `packages/core` directory, run `npm run build`.
