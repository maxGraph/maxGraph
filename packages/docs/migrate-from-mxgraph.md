# Migrate from mxGraph

**This page is a work in progress. Comments are welcome by creating an [issue](https://github.com/maxGraph/maxGraph/issues)
or opening a [discussion](https://github.com/maxGraph/maxGraph/discussions/categories/q-a).!**

The `maxGraph` API is close to the former `mxGraph` API. This page aims to help the migration to the new API.  

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
