---
sidebar_position: 1
---

# Introduction

[//]: # (extract of <rootdir>/README.md)
`maxGraph` is a TypeScript library which can display and allow interaction with vector diagrams. At a high level, it provides:
- **Nodes**, also known as **vertices** which are typically represented by shapes like rectangles.
- **Edges** which can be lines and arrows which normally point between one node and another.

It provides many of the diagramming features which would be expected by a piece of presentation software like Microsoft® PowerPoint™
or LibreOffice® Impress such as being able to resize, move or rotate nodes, but has a stronger focus on automatic layout
algorithms and applications of [Graph Theory](https://en.wikipedia.org/wiki/Graph_theory). It is suited towards software
which requires finer-grained customization of functionality than off-the-shelf packages.

[//]: # (END OF 'extract of <rootdir>/README.md')

## About this documentation

:::tip

The documentation hosted at https://maxgraph.github.io/maxGraph includes the latest development changes.

To visualize the documentation for a specific version (and the corresponding demo):
- First, download the archive of the website attached to the [related release](https://github.com/maxGraph/maxGraph/releases). Documentation archives are available as of version `0.10.3`.
- Decompress the archive (it may include archives, in this case decompress them)
- Rename the root folder to maxGraph (the case matters!)
- From the parent of the root folder, start a webserver with a command like `npx http-server -c-1`
- The website will be available at `http://localhost:8080/maxGraph/` (or something similar) 

:::


## Quick Start

To know how to install maxGraph and how to implement a first example, take a look at the [Getting Started](./getting-started.mdx) guide.


## Next Steps

Let's continue with the [Manual](./manual/index.md) to understand the `maxGraph` concepts.

For more information on how to use specific features, please refer to the [Usage](/docs/category/usage) documentation.


