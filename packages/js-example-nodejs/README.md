# Integrate `maxGraph` in a headless environment with Node.js

Demonstrate how to integrate maxGraph with Node.js to use it in a headless environment.

In this example, `jsdom` is used to provide an implementation of the browser objects whose `maxGraph` depends on.
These objects are not provided by Node.js.

The example provides a script using CommonJS and another one using ESM.

The CommonJS example creates a Graph, exports its model to an XML file and to an SVG file.

**IMPORTANT**: the ESM script is currently not working because `maxGraph` doesn't provide ESM compatible yet with Node.js.
This will be implemented in the future with [xxxx]().


## Setup

Initialize all packages
> From the repository root, run `npm install`.

Build maxgraph@core
> From the `packages/core` directory, run `npm run build`.
