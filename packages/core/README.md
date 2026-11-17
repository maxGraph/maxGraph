# @maxgraph/core

<!-- extract of ../../README.md -->
`maxGraph` is a TypeScript library for building interactive diagram applications. At its core, it manages:
- **Vertices**: Nodes displayed as shapes (rectangles, ellipses, custom designs)
- **Edges**: Connections between vertices (lines, arrows, custom paths)

Beyond basic diagram editing (resize, move, rotate), `maxGraph` provides automatic layout algorithms, graph theory operations, and deep API-level control.
It's designed for developers building custom diagramming tools (flowchart editors, data lineage visualizers, network maps, process designers) where off-the-shelf solutions lack the flexibility or programmability you need.

`maxGraph` continues the legacy of [mxGraph](https://github.com/jgraph/mxgraph) (archived in 2020) as its actively maintained successor.
It preserves mxGraph's comprehensive features and XML compatibility while modernizing with native TypeScript, modular architecture, and smaller bundle sizes.
Active development ensures continuous bug fixes and new capabilities.
<!-- END OF 'extract of ../../README.md' -->

<!-- extract of ../../README.md -->
## Features

- 🎨 **Rich visual library**: Built-in shapes, custom stencils, and various edge routing algorithms (orthogonal, Manhattan, elbow, etc.)
- 🔀 **Automatic layouts**: Hierarchical, tree, circle, organic, and swimlane layouts for organized diagrams
- 🖱️ **Interactive editing**: Move, resize, rotate, connect, and edit cells with mouse and keyboard
- 📂 **Hierarchical grouping**: Organize elements with groups, collapse/expand, and drill-down navigation
- ↩️ **Undo/redo**: Full history tracking for all operations
- 💾 **XML import/export**: Compatible with mxGraph format for data persistence
- 🎯 **Event system**: React to any graph change (clicks, moves, adds, removes, style changes)
- 🛠️ **Native TypeScript**: Complete type definitions, zero dependencies, tree-shakable architecture
- 🔌 **Framework-agnostic**: Works with React, Vue, Angular, or vanilla JavaScript
- ⚙️ **Highly customizable**: 100+ style properties per cell, custom shapes, and plugin architecture

[📚 View full feature list](https://maxgraph.github.io/maxGraph/docs/intro#features)


## Browser support

Chrome, Edge, Firefox, Safari, Chromium based browsers (Brave, Opera, ....) for mobile and desktop.

## Project status

`maxGraph` is currently under active development, with a few adjustments still required to match the behavior of `mxGraph`.
In the meantime, new features are also being added to enrich the library.

Please try it in your application and [submit an issue](https://github.com/maxGraph/maxGraph/issues) if you think that something is not working.

You can also try `maxGraph` right away in the [online demo](https://maxgraph.github.io/maxGraph/demo/), no installation needed.
<!-- END OF 'extract of ../../README.md' -->


For more details, see the [maxGraph GitHub repository](https://github.com/maxGraph/maxGraph#readme).

## Install

```
npm install @maxgraph/core
```

## Getting started

All the information is available in the [README of the GitHub repository](https://github.com/maxGraph/maxGraph).
