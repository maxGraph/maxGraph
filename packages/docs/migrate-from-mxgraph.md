# Migration guide: mxGraph to maxGraph

This documentation provides instructions for migrating from `mxGraph` to `maxGraph`.
It includes information about application setup changes, code changes, styles, event handling and other relevant information.

Here's a breakdown of the proposed changes:

1. Application setup:
    - Remove the `mxgraph` dependency and add `maxgraph@core` instead.
    - Replace the `mxGraph` initialization code with direct access to `maxGraph` objects.

2. General guidelines:
    - Remove the `mx` prefix from `mxGraph` object names in `maxGraph`.
    - Some utility functions have been removed because they are available in modern versions of **ECMAScript**.

3. Specific code changes:
    - Renaming and moving of certain classes and methods.
    - Rename and update properties in several objects.
    - Provide instructions for migrating code related to cell manipulation, styles, etc.

4. Migrate styles:
    - Explain the differences between the `mxGraph` and `maxGraph` styles.
    - List property renames and type changes.
    - Provide migration instructions for standard styles defined using `StyleSheet` and specific style properties applied to cells.

5. Miscellaneous:
    - Include additional documentation, examples and warnings related to the migration process from `mxGraph` to `maxGraph`.

> **Note:** **⚠️⚠️⚠️ This page is under construction. ⚠️⚠️⚠️  
Comments are welcome by creating an [issue](https://github.com/maxGraph/maxGraph/issues)
or starting a [discussion](https://github.com/maxGraph/maxGraph/discussions/categories/q-a)!**.

The `maxGraph` APIs are not fully compatible with the `mxGraph` APIs, but the `maxGraph` APIs are close to the former `mxGraph` APIs.
The concepts are the same, so experienced `mxGraph` users should be able to switch from `mxGraph` to `maxGraph` without problems.

The main changes are the removal of support for Internet Explorer (including VML support) and Legacy Edge.

## Application setup

### Replace the `mxgraph` dependency with `maxgraph@core`

- Remove the `mxgraph` dependency from your project:
```shell
npm uninstall mxgraph
```

- Install the `maxgraph@core` dependency:  
```shell
npm install maxgraph@core
```
ℹ️ The `maxgraph@core` package contains the core functionality of `maxGraph`.

### Initialize `maxGraph`

In your application setup code, replace the `mxGraph` initialization code that uses the `factory` function with direct access to `maxGraph` objects.

For example, if you had code like this in `mxGraph`:

```typescript
import factory from 'mxgraph';

const mxgraph = factory({});
const graph = mxgraph.mxGraph(container);

const point = new mxgraph.mxPoint(10, 50);
// ... more initialization code
```

Replace it with the corresponding code in `maxGraph`:

```typescript
import { Graph } from 'maxgraph';

const graph = new Graph(container);

const point = new Point(10, 50);
// ... more initialization code
```

### TypeScript Setup

#### Remove the `typed-mxgraph` dependency

If you used the `@typed-mxgraph/typed-mxgraph` dependency in your project, remove it from your `package.json` file:

```shell
npm uninstall @typed-mxgraph/typed-mxgraph
```

#### Remove `typeroots` settings

Remove any `typeroots` settings related to `typed-mxgraph` from your `tsconfig.json` file.

For example, if you have a configuration like this:

```json
"typeroots": ["./node_modules/@types", "./node_modules/@typed-mxgraph/typed-mxgraph"]
```

Replace with:

```json
"typeroots": ["./node_modules/@types"]
```
Or remove the line.

## General Guidelines

Here are some general guidelines to keep in mind when migrating from `mxGraph` to `maxGraph`:

- The names of `mxGraph` objects were all prefixed with `mx`. This prefix has been dropped in `maxGraph`.
- Most names remain the same, but some utility functions whose implementation is natively available in modern versions of ECMAScript have been removed.

## Specific code changes

This section outlines specific code changes required when migrating from `mxGraph` to `maxGraph`.

> **Note:** Much information is available at https://github.com/maxGraph/maxGraph/pull/70.

### Renaming classes and moving methods

Some classes and methods have been renamed or moved in `maxGraph`. Update your code accordingly:


### Rename and update properties

Rename or update properties in various objects as follows:

Overlay.strokewidth -> strokeWidth


### Shape

Shapes: consistent postfix shapes
- mxRectangleShape -> RectangleShape
- mxImageShape -> ImageShape
- mxEllipse -> EllipseShape
- mxRhombus -> RhombusShape
- mxMarker -> MarkerShape
- mxConnector -> ConnectorShape
- mxText -> TextShape

Rename shape properties
  - strokewidth -> strokeWidth

### mxUtils split

Move functions to their own namespaces

domUtils
- extractTextWithWhitespace: signature changed (mais ne semble plus etre la signature meme)

stringUtils
- trim

styleUtils
- convertPoint

xmlUtils
- getXml
- createXmlDocument()


### SvgCanvas2D
constructor Element → SvgElement, boolean
getAlternateText change types

mxAbstractCanvas2D -> AbstractCanvas2D
- arcTo(rx: number, ry: number, angle: number, largeArcFlag: number, sweepFlag: number, x: number, y: number) -> arcTo(rx: number, ry: number, angle: number, largeArcFlag: boolean, sweepFlag: boolean, x: number, y: number)

mxSvgCanvas2D -> SvgCanvas2D
- mxSvgCanvas2D.format:(value: string) => number -> SvgCanvas2D.format:(value: number) => number

### Graph
Properties removed in favor of plugins
- graph.panningHandler → this.graph.getPlugin('PanningHandler') as PanningHandler;

other
- getModel() -> graph.model
- insertVertex/insertEdge: also accept an object instead of multiple parameters


### Client
renamed properties: TODO which


### Cell manipulation
Functions that existed in mxGraph and mxGraphModel have been removed. They provided a way to extend/override the default behavior of mxGraphModel or mxCell.
Only the functions for mxCell/Cell remain. See https://github.com/maxGraph/maxGraph/pull/24

mxCell -> Cell
- mxCell.style:string -> Cell.style:CellStyle


mxGraphDataModel
mxGraphDataModel.filterDescendants(filter: (cell: mxCell) => boolean, cell:mxCell) -> Cell.filterDescendants
mxGraphDataModel.getGeometry(cell: mxCell) -> Cell.getGeometry()
mxGraphDataModel.isEdge(cell: mxCell) -> Cell.isEdge()
mxGraphDataModel.getParent(cell: mxCell) -> Cell.getParent()

### Misc

Remove styles: https://github.com/maxGraph/maxGraph/pull/31

Codec renaming and output: https://github.com/maxGraph/maxGraph/pull/70

mxDictionary<T> -> Dictionary<K, V>

### Event handling

mxEvent
mxEvent -> eventUtils
mxEvent.isLeftMouseButton -> eventUtils.isLeftMouseButton
mxEvent.isMultiTouchEvent -> eventUtils.isMultiTouchEvent

mxEvent.PAN_START -> InternalEvent.PAN_START
mxEvent.PAN_END -> InternalEvent.PAN_END
mxEvent.addMouseWheelListener -> InternalEvent.addMouseWheelListener
mxEvent.consume -> InternalEvent.consume

mxMouseEvent -> InternalMouseEvent



The event handling mechanism in `maxGraph` has been updated. Use the following guidelines to update your event handling code:

- `mxEvent` has been replaced by `eventUtils` and `InternalEvent` for most event-related operations.
- Use the `eventUtils.isMultiTouchEvent` method to detect touch events.
- Use the `eventUtils.isLeftMouseButton` method to detect mouse events.

### Styling

`mxGraph`
- default styles defined via mxStyleSheet
- Style of a cell: a string containing all properties and values, using a specific syntax and delimiter

`maxGraph`
- default styles defined via StyleSheet
- style of a Cell: a dedicated object that reuses the same properties as the string form used by mxGraph (see below for changes)

mxStyleMap (typed-mxgraph type) -> CellStateStyle


#### Properties

In `mxGraph`, the properties are defined as string. In `maxGraph`, they are object properties.
Property names and values are generally the same. The ones that change are listed below.

- The `mxConstants` object has been replaced by the object properties.
- `mxUtils.getValue` has been replaced by `InternalUtils.getValue`.

Property renaming
- `autosize` to `autoSize` (from maxgraph@0.2.0)

Property type changed from `number` (0 or 1) to `boolean` (if not specified, from maxgraph@0.1.0):
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



### Migration of default styles defined with StyleSheet

**TODO: what is a StyleSheet? link to JSDoc/code**

The migration consists of converting `StyleMap` (TODO link to typed-mxgraph) objects to `CellStyle` objects.

If you have been using string or named properties, you can keep that syntax.
You just need to rename the property or update its value as described in (TODO anchor to properties change paragraph)
```ts
style['propertyName1'] = value1
style.propertyName2 = value2
```

If you used `mxConstants`, remove it and use named properties instead.
```ts
// mxGraphStyle is a StyleMap
mxGraphStyle[mxConstants.STYLE_STARTSIZE] = 8

// maxGraph style is a CellStyle
style['startSize'] = 8;
// or
style.startSize = 8;
```


### Migration of specific style properties applied to dedicated cells

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


**TODO migration example**

⚠️⚠️⚠ **WARNING**: Be aware of the properties that have been renamed or whose value types have changed, as described in (TODO anchor to properties change paragraph)


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

To not merge properties of the default style, the style string must start with a `;` (semicolon). As in `;style1;style2;prop1=value1;.....`.

Documented in jgraph/mxgraph@v4.2.2/javascript/src/js/view/mxStylesheet.js#L33-L38

> To override the default style for a cell, add a leading semicolon to the style definition, e.g. ;shadow=1

This is currently not supported in maxGraph: https://github.com/maxGraph/maxGraph/issues/154 "Add a way to not use default style properties when calculating cell styles".

## Conclusion

By following these guidelines and updating your codebase accordingly, you should be able to migrate your application from `mxGraph` to `maxGraph`.
Remember to test your application thoroughly after the migration to ensure that its functionality is preserved.
If you encounter any problems during the migration process, please refer to the `maxGraph` documentation or ask the `maxGraph` community for help.