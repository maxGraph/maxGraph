# Migrate from mxGraph

**This page is a work in progress. Comments are welcome by creating an [issue](https://github.com/maxGraph/maxGraph/issues)
or opening a [discussion](https://github.com/maxGraph/maxGraph/discussions/categories/q-a).!**

The `maxGraph` APIs are not fully compatible with the `mxGraph` APIs, but the `maxGraph` APIs are close to the former `mxGraph` APIs.
The concepts are the same, so experienced _mxGraph_ users should be able to switch from _mxGraph_ to _maxGraph_ without issues.

The major changes are the removal of support for Internet Explorer (including VML support) and Legacy Edge.


## Application setup

Remove the
- `mxgraph` dependency and add `maxgraph@core` instead.  
- _mxGraph_ initialization code using the `factory` function. Access _maxGraph_ objects directly.

### TypeScript

Remove the
- `@typed-mxgraph/typed-mxgraph` dependency in the `package.json` file
- `typeroots` settings related to `typed-mxgraph` in the `tsconfig.json` file

As an example, you can check [this project](https://github.com/maxGraph/maxgraph-integration-examples/tree/main/projects/rollup-ts) which has been migrated
from a [typed-mxgraph example](https://github.com/typed-mxgraph/typed-mxgraph-example-bundled-with-rollup).


## General guidelines

- The names of _mxGraph_ objects were all prefixed with `mx`. The prefix has been dropped in _maxGraph_.
- Most names remain the same.
- Some utility functions, whose implementation is natively available in modern versions of ECMAScript, have been removed.


## Style related properties

Property rename
- `autosize` into `autoSize` (as of maxgraph@0.2.0)

Property type change from `number` (0 or 1) to `boolean` (if not specified, as of maxgraph@0.1.0):
- `anchorPointDirection`
- `absoluteArcSize` (as of maxgraph@0.2.0)
- `autosize`
- `backgroundOutline` (as of maxgraph@0.2.0)
- `bendable`
- `cloneable`
- `curved`
- `dashed`
- `deletable`
- `editable`
- `endFill`
- `entryPerimeter`
- `exitPerimeter`
- `fixDash`
- `flipH`
- `flipV`
- `foldable`
- `glass`
- `horizontal`
- `imageAspect`
- `movable`
- `noEdgeStyle`
- `noLabel`
- `orthogonal`
- `orthogonalLoop`
- `pointerEvents`
- `resizable`
- `resizeHeight`
- `resizeWidth`
- `rotatable`
- `rounded`
- `shadow`
- `startFill`
- `swimlaneLine`
