# maxGraph Examples

The example are provided as a Single-Page application powered by [Storybook](https://storybook.js.org/).

Stories are written in both JavaScript and TypeScript. The target is to only have TypeScript stories to benefit from type
checking, update the examples more easily when the API changes, and catch errors sooner.

The examples have been migrated from [mxGraph v4.2.2](https://github.com/jgraph/mxgraph/tree/v4.2.2/javascript/examples).
Some of them are still not working due to problems in the story itself or in `maxGraph`.

Some examples have not been migrated yet, they are located in the [stashed](stashed) directory. These are mainly examples that
involves the `Editor` classes and the custom `GraphEditor` code (that serves as base for the draw.io implementation).
