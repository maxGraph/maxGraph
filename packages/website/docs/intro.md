---
sidebar_position: 1
---

# Introduction

[//]: # (extract of <rootdir>/README.md)
`maxGraph` is a TypeScript library for building interactive diagram applications. At its core, it manages:
- **Vertices** — Nodes displayed as shapes (rectangles, ellipses, custom designs)
- **Edges** — Connections between vertices (lines, arrows, custom paths)

Beyond basic diagram editing (resize, move, rotate), `maxGraph` provides automatic layout algorithms, graph theory operations, and deep API-level control.
It's designed for developers building custom diagramming tools—flowchart editors, data lineage visualizers, network maps, process designers — where off-the-shelf solutions lack the flexibility or programmability you need.

`maxGraph` continues the legacy of [mxGraph](https://github.com/jgraph/mxgraph) (archived in 2020) as its actively maintained successor.
It preserves mxGraph's comprehensive features and XML compatibility while modernizing with native TypeScript, modular architecture, and smaller bundle sizes.
Active development ensures continuous bug fixes and new capabilities.

[//]: # (END OF 'extract of <rootdir>/README.md')


## Features

### Core Architecture
- **Graph Model**: Manages the structure with three primary elements: vertices (nodes), edges (connections), and groups (sub-graphs)
- **Vertices**: Individual nodes that can contain labels, data, and visual properties. Each vertex can be styled independently
- **Edges**: Flexible connections that can link two vertices, one vertex (dangling edges), or exist standalone
- **Groups**: Hierarchical organization with parent-child relationships, enabling collapse/expand, nested structures, and collective operations

### Drawing and Display
- Built-in shapes: rectangles, ellipses, rhombuses, cylinders, clouds, triangles, hexagons, actors, swimlanes, and more
- Edge types: connectors, arrows, polylines with several marker styles (classic, block, open, oval, diamond, and variants)
- Various edge routing algorithms: orthogonal, Manhattan, elbow, entity-relation, segment, loop, and more
- Custom shapes through the stencil system (XML-defined shapes)
- Labels, tooltips, overlays (badges/icons on cells), and image support
- SVG rendering

### Interaction
- Move, resize, and rotate cells
- In-place label editing
- Create connections by dragging between cells
- Rubberband (box) selection and multi-selection
- Panning and zooming (zoom in, zoom out, fit-to-page)
- Keyboard shortcuts
- Drag and drop from external sources
- Context menus and tooltips
- Snap to grid and alignment guides
- Undo and redo for all operations

### Automatic Layouts
- Hierarchical layout (Sugiyama-style, suited for flowcharts and org charts)
- Compact tree and radial tree layouts
- Circle layout
- Organic layout (force-directed)
- Stack layout (horizontal or vertical)
- Swimlane layout
- Parallel edge layout
- Composite layout (combine several layouts)

### Organization and Structure
- **Hierarchical grouping**: Parent-child relationships for organizing related elements (like folders in a file system)
- **Collapse/expand**: Folding and unfolding of groups to manage diagram complexity
- **Drill-down navigation**: Navigate into groups to focus on sub-graphs
- **Layers and visibility**: Control which elements are visible or hidden
- **Swimlanes**: Visual separation for business process diagrams and workflows
- **Connection validation**: Multiplicity rules to enforce valid connections between cell types
- **Ports**: Precise connection points on vertices for controlled edge attachment
- **Z-order management**: Control stacking order (bring to front, send to back)
- **Page breaks**: Visualization for multi-page printing

### Data and Serialization
- **XML import/export**: Compatible with `mxGraph` format for data persistence and interoperability
- **Batch updates**: Efficient model changes with `batchUpdate()` to group multiple operations
- **Event system**: React to any graph change (clicks, moves, adds, removes, style changes, etc.)
- **Undo/redo**: Full history tracking for all operations with UndoManager

### Developer Experience
- Written in TypeScript with complete type definitions. TypeScript integration requires **TypeScript 3.8** or higher
- Zero third-party dependencies
- Tree-shakable: use `BaseGraph` to import only what you need and reduce bundle size
- Available as both ES Module and CommonJS. The JavaScript code conforms to the `ES2020` standard
- Plugin architecture: add only the interaction handlers you need
- Style system with 100+ configurable properties per cell
- Internationalization (i18n) support
- Works with any framework (vanilla JS, React, Angular, Vue, etc.)
- CSS and image assets included in the npm package


## About this documentation

:::tip

The documentation hosted at https://maxgraph.github.io/maxGraph includes the latest development changes.

To visualize the documentation for a specific version (and the corresponding demo):
- First, download the archive of the website attached to the [related release](https://github.com/maxGraph/maxGraph/releases). Documentation archives are available as of version `0.10.3`.
- Decompress the archive (it may include archives, in this case decompress them)
- For versions prior to 0.23.0, decompress the enclosing tar file and ensure all website contents are placed in a folder named `maxGraph` (case-sensitive).
- From the parent directory of the decompressed `maxGraph` folder, start a web server with a command like `npx http-server -c-1`
- The website will be available at `http://localhost:8080/maxGraph/` (or something similar) 

:::


## Documentation Structure

This documentation is organized into several sections:
- **[Manual](./manual/index.md)**: Describes the core concepts and architecture of `maxGraph`
- **[Tutorials](./category/tutorials)**: Provides step-by-step guides to help you learn the basics of `maxGraph`
- **[Usage](./category/usage)**: Contains detailed documentation and examples for implementing specific features
- **[Development](./category/development)**: Explains how to build and contribute to `maxGraph` (for contributors and maintainers)


## Quick Start

To know how to install maxGraph and how to implement a first example, take a look at the [Getting Started](./getting-started.mdx) guide.
