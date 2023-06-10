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


## Specific code change

**NOTE**: a lot of information is available in https://github.com/maxGraph/maxGraph/pull/70


### Other


mxMouseEvent -> InternalMouseEvent


mxEvent
mxEvent -> eventUtils
mxEvent.isLeftMouseButton -> eventUtils.isLeftMouseButton
mxEvent.isMultiTouchEvent -> eventUtils.isMultiTouchEvent

mxEvent.PAN_START -> InternalEvent.PAN_START
mxEvent.PAN_END -> InternalEvent.PAN_END
mxEvent.addMouseWheelListener -> InternalEvent.addMouseWheelListener
mxEvent.consume -> InternalEvent.consume

mxAbstractCanvas2D -> AbstractCanvas2D
arcTo(rx: number, ry: number, angle: number, largeArcFlag: number, sweepFlag: number, x: number, y: number) ->
arcTo(rx: number, ry: number, angle: number, largeArcFlag: boolean, sweepFlag: boolean, x: number, y: number)

mxSvgCanvas2D -> SvgCanvas2D
mxSvgCanvas2D.format:(value: string) => number -> SvgCanvas2D.format:(value: number) => number



mxCell -> Cell
mxCell.style:string -> Cell.style:CellStyle


Shapes
consistent postfix Shapes
mxRectangleShape -> RectangleShape
mxImageShape -> ImageShape
mxEllipse -> EllipseShape
mxRhombus -> RhombusShape
mxMarker -> MarkerShape
mxConnector -> ConnectorShape

mxText -> TextShape
strokewidth -> strokeWidth

mxDictionary<T> -> Dictionary<K, V>



mxGraph -> Graph
mxGraph.getModel() -> graph.model


mxGraphDataModel
mxGraphDataModel.filterDescendants(filter: (cell: mxCell) => boolean, cell:mxCell) -> Cell.filterDescendants
mxGraphDataModel.getGeometry(cell: mxCell) -> Cell.getGeometry()
mxGraphDataModel.isEdge(cell: mxCell) -> Cell.isEdge()
mxGraphDataModel.getParent(cell: mxCell) -> Cell.getParent()

mxStylesheet -> Stylesheet
mxStyleMap -> CellStateStyle






### Classes rename (not only the 'mx' removal)

mxMouseEvent --> InternalMouseEvent


### properties rename
Overlay.strokewidth -> strokeWidth
Shape.strokewidth -> strokeWidth


### mxUtils split

Functions move to dedicated namespaces

domUtils
- extractTextWithWhitespace: signature changed (mais ne semble plus etre la meme signature)

stringUtils
- trim

xmlUtils
- getXml
- createXmlDocument()


### SvgCanvas2D
constructor Element → SvgElement, boolean
getAlternateText change types


### Graph 
Properties removed in favor of plugins
- graph.panningHandler → this.graph.getPlugin('PanningHandler') as PanningHandler;

Graph
insertVertex/insertEdge: also accept an object instead of several parameters


### Client
renamed properties: TODO which one


### Cells manipulation
Functions that existed in mxGraph and mxGraphModel have been removed. They provided a way to extend/overidde the default behavior of mxGraphModel or mxCell
Only the functions on mxCell/Cell remain. See https://github.com/maxGraph/maxGraph/pull/24


### Misc

Styles removal: https://github.com/maxGraph/maxGraph/pull/31

Codec rename and issue: https://github.com/maxGraph/maxGraph/pull/70



## Migrating styles

mxGraph
- default styles defined via mxStyleSheet
- style of a Cell: a string containing all properties and values, using a specific syntax and delimiter

maxGraph
- default styles defined via StyleSheet
- style of a Cell: a dedicated object reusing the same properties as the string form used by mxGraph (see below for changes)


### Properties

In `mxGraph`, the properties are defined as string. In `maxGraph`, they are object properties.

Property names and values are generally the same. Those that change are listed below.

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



### Migration of default styles defined using StyleSheet

**TODO: what is a StyleSheet? link to JSDoc/code**

The migration consists in converting `StyleMap` (TODO link to typed-mxgraph) objects into `CellStyle` objects.

If you used string or named properties, you can keep this syntax.
You only need to rename the property or update its value as described in (TODO anchor to properties change paragraph)
```ts
style['propertyName1'] = value1
style.propertyName2 = value2
```

If you used `mxConstants`, remove it and used named properties instead.
```ts
// mxGraphStyle is a StyleMap
mxGraphStyle[mxConstants.STYLE_STARTSIZE] = 8

// maxGraph style is a CellStyle
style['startSize'] = 8;
// or
style.startSize = 8;
```


### Migration of specific style properties applied to dedicated Cells

- **TODO: what is a style? link to JSDoc/code**
- **TODO move after the default style paragraph**


mxGraph line 50

> For a named style, the the stylename must be the first element
of the cell style:
(code)
stylename;image=http://www.example.com/image.gif
(end)
A cell style can have any number of key=value pairs added, divided
by a semicolon as follows:
(code)
[stylename;|key=value;]
(end)

mxGraph line 167

> Styles are a collection of key, value pairs and a stylesheet is a collection
of named styles. The names are referenced by the cellstyle, which is stored
in <mxCell.style> with the following format: [stylename;|key=value;]. The
string is resolved to a collection of key, value pairs, where the keys are
overridden with the values in the string.


**TODO example of migration**

**WARNING**: Be aware of the properties that have been renamed or whose value types changed as described in (TODO anchor to properties change paragraph)


```js
// Before
graph.insertVertex({
  ...
  style: 'style1;style2;shape=cylinder;strokeWidth=2;fillColor:#ffffff'
});
```


```js
// Now
graph.insertVertex({
  ...
  style: {
    baseStyleNames: ['style1', 'style2']
    shape: 'cylinder',
    strokeWidth: 2,
    fillColor: '#ffffff'
  }
});
```




To not merge properties of the default style, the style string must start with `;` (semicolon). Like in `;style1;style2;prop1=value1;.....`

Documented in jgraph/mxgraph@v4.2.2/javascript/src/js/view/mxStylesheet.js#L33-L38

> To avoid the default style for a cell, add a leading semicolon to the style definition, eg. ;shadow=1

This is currently not supported in maxGraph: https://github.com/maxGraph/maxGraph/issues/154 "Add a way to not use default style properties when computing cell style"

