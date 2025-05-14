---
sidebar_position: 3
---

# Demos and Examples
[//]: # (extract of <rootdir>/README.md)


:::tip

The documentation does not cover all the features available in `maxGraph`. However, `maxGraph` does provide numerous examples. These examples show how to use the features and how `maxGraph` can be extended to meet new needs.

This page includes links to the examples and demos available in the `maxGraph` [GitHub organization](https://github.com/maxGraph).

:::

For more comprehensive examples than the [“Getting started” example](./getting-started.mdx), this page provides a list of demos and examples to help you understand how to use `maxGraph` and integrate it into your projects.

Note that they are based on `maxGraph` features, which require the use of [CSS and images](./usage/css-and-images.md) provided in the npm package.


## Interactive Demos
- the [storybook stories](https://github.com/maxGraph/maxGraph/tree/main/packages/html/stories) demonstrates various features of maxGraph.
  - The stories were originally written in `JavaScript` and are being progressively migrated to `TypeScript`.
  - A live instance is available on the [maxGraph website](https://maxgraph.github.io/maxGraph/demo).

## TypeScript Examples
- the [ts-example](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example) project/application demonstrates how to define and use custom `Shapes` with `maxGraph`. It is a vanilla TypeScript application built by [Vite](https://vitejs.dev/).
- the [ts-example-jest-commonjs](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-jest-commonjs) project that demonstrates how to run jest tests involving `maxGraph` with ts-jest, using CommonJS.
- the [ts-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-selected-features) project/application that demonstrates the same use case as in `ts-example` but which only loads the features and configuration required by the application for an efficient tree-shaking. It is a vanilla TypeScript application built by [Vite](https://vitejs.dev/).
- the [ts-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-without-defaults) project/application demonstrates how to not use defaults plugins and style defaults (shapes, perimeters, ...). It is a vanilla TypeScript application built by [Vite](https://vitejs.dev/).

## JavaScript Examples
- the [js-example](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example) project/application demonstrates how to import and export the `maxGraph` model with XML data. It is a vanilla JavaScript application built by [Webpack](https://webpack.js.org/).
- the [js-example-nodejs](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-nodejs) project that demonstrates how to use `maxGraph` in a headless environment with Node.js.
- the [js-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-selected-features) project/application that demonstrates the same use case as in `ts-example` but which only loads the features and configuration required by the application for an efficient tree-shaking. It is a vanilla JavaScript application built by [Webpack](https://webpack.js.org/).
- the [js-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-without-defaults) project/application demonstrates how to not use defaults plugins and style defaults (shapes, perimeters, ...). It is a vanilla JavaScript application built by [Webpack](https://webpack.js.org/).

## Framework Integration and Bundlers
- the [maxgraph-integration-examples](https://github.com/maxGraph/maxgraph-integration-examples) repository shows how to integrate `maxGraph` with different frameworks and build tools.

[//]: # (END OF 'extract of <rootdir>/README.md')
