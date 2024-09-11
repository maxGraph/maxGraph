---
sidebar_position: 10
description: How-to easily migrate from mxGraph to maxGraph
---

# Migrate from mxGraph

This documentation provides instructions for migrating from `mxGraph` to `maxGraph`.
It includes information about application setup changes, code changes, styles, event handling and other relevant information.

Here's a breakdown of the proposed changes:

1. [Application setup](#application-setup)
2. [General guidelines](#general-guidelines)
3. [Specific code changes](#specific-code-changes)

:::warning

**This page is under construction.**

Comments are welcome by creating an [issue](https://github.com/maxGraph/maxGraph/issues)
or starting a [discussion](https://github.com/maxGraph/maxGraph/discussions/categories/q-a)!.

Feel free to create a [Pull Request](https://github.com/maxGraph/maxGraph/pulls) to enrich the content or fix errors.

:::

The `maxGraph` APIs are not fully compatible with the `mxGraph` APIs, but the `maxGraph` APIs are close to the former `mxGraph` APIs.
The concepts are the same, so experienced `mxGraph` users should be able to switch from `mxGraph` to `maxGraph` without problems.

The main changes are the removal of support for Internet Explorer (including VML support) and Legacy Edge.

The initial description of the changes has been described in [#70](https://github.com/maxGraph/maxGraph/pull/70).

## Application setup

To migrate your application setup from `mxGraph` to `maxGraph`, follow these steps:

### Replace the `mxgraph` dependency with `maxgraph@core`

- Remove the `mxgraph` dependency from your project:
```shell
npm uninstall mxgraph
```

- Install the `maxgraph@core` dependency:  
```shell
npm install maxgraph@core
```

:::info

The `maxgraph@core` package contains the core functionality of `maxGraph`.

:::

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
"typeroots": ["./node_modules/@types", "./node_modules/@typed-mxgraph/typed-mxgraph", ...]
```

Remove `"./node_modules/@typed-mxgraph/typed-mxgraph"`.

If you only configured `typeroots` to add the `typed-mxgraph` types, remove the line to restore the [TypeScript defaults](https://www.typescriptlang.org/tsconfig/#typeRoots).


## General Guidelines

Here are some general guidelines to keep in mind when migrating from `mxGraph` to `maxGraph`:

- The names of `mxGraph` objects were all prefixed with `mx`. This prefix has been dropped in `maxGraph`.
- Most names remain the same, but some utility functions whose implementation is natively available in modern versions of ECMAScript have been removed.

## Specific code changes

This section outlines specific code changes required when migrating from `mxGraph` to `maxGraph`.
Please update your code accordingly.

:::note

A wide range of information is available at https://github.com/maxGraph/maxGraph/pull/70.

:::

### Overlay
The `strokewidth` property has been renamed to `strokeWidth` in `maxGraph`. 

### Shape

The shape names in `maxGraph` have been updated to have a consistent postfix. Please update the shape names in your code as follows:

- `mxConnector` should be updated to `ConnectorShape`.
- `mxEllipse` should be updated to `EllipseShape`.
- `mxImageShape` should be updated to `ImageShape`.
- `mxRectangleShape` should be updated to `RectangleShape`.
- `mxMarker` should be updated to `MarkerShape`.
- `mxRhombus` should be updated to `RhombusShape`.
- `mxStencil` should be updated to `StencilShape`.
- `mxText` should be updated to `TextShape`.

Additionally, some shape properties have been renamed:

- The `strokewidth` property should now be replaced by `strokeWidth`.

#### `mxStencil` to `StencilShape`

In maxGraph@0.11.0, the `allowEval` and `defaultLocalized` properties have been removed. Configure these properties using `StencilShapeConfig`.


### `mxUtils` split
Several functions in `mxUtils` have been moved to their own namespaces in `maxGraph`. Some remain in `utils`.

Here are a few examples of the methods that have been moved.

#### `domUtils`
- `extractTextWithWhitespace()`: : Update your code to use `domUtils.extractTextWithWhitespace()` instead of `mxUtils.extractTextWithWhitespace()`.

#### `mathUtils`
- `getBoundingBox()`: Update your code to use `mathUtils.getBoundingBox()` instead of `mxUtils.getBoundingBox()`.
- `getPortConstraints()`: Update your code to use `mathUtils.getPortConstraints()` instead of `mxUtils.getPortConstraints()`.
- `getRotatedPoint()`: Update your code to use `mathUtils.getRotatedPoint()` instead of `mxUtils.getRotatedPoint()`.

#### `stringUtils`
- `trim()`: Update your code to use `stringUtils.trim()` instead of `mxUtils.trim()`.

#### `styleUtils`
- `convertPoint()`: Update your code to use `styleUtils.convertPoint()` instead of `mxUtils.convertPoint()`.

#### `xmlUtils`
- `getXml`(): Update your code to use `xmlUtils.getXml()` instead of `mxUtils.getXml()`.
- `createXmlDocument()`: Update your code to use `xmlUtils.createXmlDocument()` instead of `mxUtils.createXmlDocument()`.


### Removed methods from `mxUtils`

The following methods of `mxUtils` have been removed without replacements in `maxGraph`. Use your own implementation or 3rd party libraries instead:
- `mxUtils.button`
- `mxUtils.error`


### `mxAbstractCanvas2D`

The `mxAbstractCanvas2D` class has been renamed to `AbstractCanvas2D` in `maxGraph`, and there is a parameter type change in one of its methods.

#### `arcTo()`

The `arcTo()` method in `AbstractCanvas2D` has updated parameter types. The `largeArcFlag` and `sweepFlag` parameters, which were previously of type `number`, are now of type `boolean`.  
Here is the updated signature:

**Before**
```typescript
arcTo:(rx: number, ry: number, angle: number, largeArcFlag: number, sweepFlag: number, x: number, y: number) => void
```

**Now**
Some `number` parameters that took the `0` or `1` values have been transformed into `boolean` parameters.
```typescript
arcTo:(rx: number, ry: number, angle: number, largeArcFlag: boolean, sweepFlag: boolean, x: number, y: number) => void
```

### `mxSvgCanvas2D`

The `mxSvgCanvas2D` class has been renamed to `SvgCanvas2D` in `maxGraph`.

#### Constructor

The constructor parameter has been updated. Instead of accepting an `Element`, it now expects a `SvgElement` and a `boolean` value.

**Before**
```typescript
// Old constructor
const canvas = new mxgraph.mxSvgCanvas2D(element);
```

**Now**
```typescript
// Updated constructor
const canvas = new SvgCanvas2D(svgElement, oneBoolean);
```

#### `getAlternateText()`

**TODO** change types ???????

#### `format()`

The `value` parameter, which was previously of type `string`, is now of type `number`.

**Before**
```typescript
format:(value: string) => number
```

**Now**
```typescript
format:(value: number) => number
```


### `mxGraph`

The `mxGraph` class has been renamed to `Graph` in `maxGraph`.
There have also been some changes related to properties and methods.

Some properties have been removed in favor of the usage of plugins. Plugins are registered at the `Graph` initialization by passing
an array of plugins to the constructor.

| property removed        | method removed                | new plugin              |
|-------------------------|-------------------------------|-------------------------|
| `connectionHandler`     | `createConnectionHandler`     | `ConnectionHandler`     |
| `graphHandler`          | `createGraphHandler`          | `SelectionHandler`      |
| `panningHandler`        | `createPanningHandler`        | `PanningHandler`        |
| `popupMenuHandler`      | `createPopupMenuHandler`      | `PopupMenuHandler`      |
| `selectionCellsHandler` | `createSelectionCellsHandler` | `SelectionCellsHandler` |
| `tooltipHandler`        | `createTooltipHandler`        | `TooltipHandler`        |

#### Example of migration with the `panningHandler` property

The `panningHandler` property has been removed and replaced by a plugin. Instead of accessing `panningHandler` directly, you can use the `getPlugin()` method to get the `PanningHandler` plugin instance. Here's an example:

**Before**
```typescript
// Old way to access panningHandler
const panningHandler = graph.panningHandler;
```

**Now**
```typescript
// Updated way using getPlugin()
const panningHandler = this.graph.getPlugin('PanningHandler') as PanningHandler;
```

#### `getModel()`

Instead of calling `getModel()` that returned an instance of `mxGraphModel`, call `getDataModel` which returns an instance of `GraphDataModel`.
Here's an example:

**Before**
```typescript
// Old way of accessing the model
const model = graph.getModel();
```

**Now**
```typescript
// Updated way to access the model
const model = graph.getDataModel();
```

#### `insertVertex()` and `insertEdge()`

The `insertVertex()` and `insertEdge()` methods in `maxGraph` now also accept one object as parameter instead of multiple parameters. Instead of passing individual parameters, you can pass an object containing all the required properties.

The former methods having several parameters still exist but the new signature should be used instead.

Here's an example:

**Before**
```typescript
// Old way of using insertVertex()
graph.insertVertex(parent, id, value, x, y, width, height, style);

// Old way of using insertEdge()
graph.insertEdge(parent, id, value, source, target, style);
```

**Now**
```typescript
// New way to use an object parameter for insertVertex()
graph.insertVertex({ parent, id, value, x, y, width, height, style });

// New way to use an object parameter for insertEdge()
graph.insertEdge({ parent, id, value, source, target, style });
```

#### Folding properties

The following folding properties have been removed:
  - `collapsedImage`
  - `collapseToPreferredSize`
  - `expandedImage`
  - `foldingEnabled`

They are now set in the `Graph.options` object with the same property name.

For example, to set the `foldingEnabled` property, instead of doing `Graph.foldingEnabled`, you should set instead `Graph.options.foldingEnabled`.

#### Other properties

- the `tolerance` property has been renamed (and the get/set method as well). It is now named `snapTolerance`.

### mxResources

The `mxResources` class has been renamed to `Translations` in `maxGraph`.


### Client

The `mxClient` class has been removed into `Client`.

Removed properties
- `defaultBundles`
- `mxForceIncludes`: it was used to force loading the JavaScript files in development mode in mxGraph. We are not
managing development mode in that way anymore.
- `mxLoadResources`: not used anymore
- `mxLoadStylesheets`: not used anymore
- `mxResourceExtension`: it was only used in `Translations`, so only keep the property in `Translations`

Removed methods
- `setForceIncludes`: the `mxForceIncludes` property has been removed
- `setLoadResources`: the `mxLoadResources` property has been removed
- `setLoadStylesheets`: the `mxLoadStylesheets` property has been removed
- `setResourceExtension`: the `mxResourceExtension` property has been removed

Moved methods
- `link` method moved and renamed `domUtils.addLinkToHead`


### Cell manipulation

Some methods previously available in `mxGraph` and `mxGraphModel` have been removed. These methods allowed for customizing the behavior of `mxGraphModel` and `mxCell`. However, now only the methods specific to `Cell` remain.  

:::note

You can find more information about these changes in the following GitHub pull request: https://github.com/maxGraph/maxGraph/pull/24.

:::


#### `mxCell`

The `mxCell` class has been renamed to `Cell` for simplicity.

The `style` property of `Cell` has undergone a type change from `string` to `CellStyle`. See the paragraph about "Migration of specific style properties applied to dedicated cells"
for more details about how to migrate the style property.


#### `mxGraph`

Some methods were removed:
- `mxGraph.isCellVisible(cell)` see https://github.com/maxGraph/maxGraph/discussions/179#discussioncomment-5389942 for rationale


#### `mxGraphDataModel`

Several methods from the `mxGraphDataModel` class have been moved to the `Cell` class. These methods no longer need the `cell` parameter:

- `filterDescendants()`
- `getGeometry()`
- `isEdge()`
- `getParent()`

Some methods in `mxGraphModel` that were general manipulation of cells and independent of the model have been moved to the `cellArrayUtils` namespace and are now available as individual functions.
- `cloneCell()` (from version 0.11.0)
- `cloneCells()`
- `getOpposite()`
- `getParents()`
- `getTopmostCells()`

Others were removed:
- `cloneImpl()`
- `isVisible(cell)` see https://github.com/maxGraph/maxGraph/discussions/179#discussioncomment-5389942 for rationale
- `restoreClone()` (from version 0.11.0)

### Misc

- Codec renaming and output: https://github.com/maxGraph/maxGraph/pull/70
- `mxDictionary`&lt;T&gt; to `Dictionary`&lt;K, V&gt;


### Event handling

The event handling mechanism in `maxGraph` has been updated. Use the following guidelines to update your event handling code:

- `mxEvent` has been replaced by `eventUtils` and `InternalEvent` for most event-related operations.
- `mxMouseEvent` has been replaced by `InternalMouseEvent`.

#### `eventUtils`
- Use the `eventUtils.isMultiTouchEvent()` method, to detect touch events, instead of `mxEvent.isMultiTouchEvent()`.
- Use the `eventUtils.isLeftMouseButton()` method, to detect mouse events, instead of `mxEvent.isLeftMouseButton()`.

#### `InternalEvent`
- Use the `InternalEvent.PAN_START` property instead of `mxEvent.PAN_START`.
- Use the `InternalEvent.PAN_END` property instead of `mxEvent.PAN_END`.
- Use the `InternalEvent.addMouseWheelListener()` method instead of `mxEvent.addMouseWheelListener()`.
- Use the `InternalEvent.consume()` method instead of `mxEvent.consume()`.


### Styling

`mxGraph`
- Default styles defined with `mxStyleSheet`.
- Style of a Cell: a string containing all properties and values, using a specific syntax and delimiter.
- Style of a State Cell: a `StyleMap` instance (See [StyleMap](https://github.com/typed-mxgraph/typed-mxgraph/blob/187dd4f0dc7644c0cfbc998dae5fc90879597d81/lib/view/mxStylesheet.d.ts#L2-L4) as a `typed-mxgraph` type).

`maxGraph`
- Default styles defined via `StyleSheet`.
- Style of a Cell: a dedicated `CellStyle` object that reuses the same properties as the string form used by mxGraph (see below for changes).
- Style of a State Cell: a `CellStateStyle` instance.


#### Properties

In `mxGraph`, the properties are defined as string. The property keys are defined in `mxConstants` and are prefixed by `STYLE_` like `mxConstants.STYLE_FILLCOLOR`.

In `maxGraph`, they are object properties. `mxConstants.STYLE_*` have been replaced by the object properties (see PR [#31](https://github.com/maxGraph/maxGraph/pull/31)).

Property names and values are generally the same as in `mxGraph`. The ones that change are listed below.

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
- `portConstraintRotation`
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

The migration consists of converting [`StyleMap`](https://github.com/typed-mxgraph/typed-mxgraph/blob/187dd4f0dc7644c0cfbc998dae5fc90879597d81/lib/view/mxStylesheet.d.ts#L2-L4) objects to `CellStyle` objects.

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

#### `mxGraph` style

[mxGraph line 50](https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/src/js/view/mxGraph.js#L50-L62)

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

[mxGraph line 167](https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/src/js/view/mxGraph.js#L167-L171)

> Styles are a collection of key, value pairs and a stylesheet is a collection
of named styles. The names are referenced by the cellstyle, which is stored
in 'mxCell.style' with the following format: [stylename;|key=value;]. The
string is resolved to a collection of key, value pairs, where the keys are
overridden with the values in the string.

See also
- https://jgraph.github.io/mxgraph/docs/tutorial.html#3.3
- https://jgraph.github.io/mxgraph/docs/manual.html#3.1.3.1


#### `maxGraph` style

In maxGraph, the style is no more defined as a string but as a `CellStyle` object.

Most of the time, the name of `CellStyle` properties is the same as the style keys in the mxGraph style.

:::warning

Be aware of the properties that have been renamed or whose value types have changed, as described in the [style properties](#properties) paragraph.

:::

**Migration example**

If you want to write code to migrate mxGraph to maxGraph style, you can have a look at `packages/core/src/serialization/codecs/mxGraph/utils.ts`.

```js
// Before
graph.insertVertex(..., 'style1;style2;shape=cylinder;strokeWidth=2;fillColor:#ffffff');
```


```js
// Now using the insertVertex method taking a single parameter
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

**Special migration case**
In `mxGraph`, to not merge properties of the default style, the style string must start with a `;` (semicolon) as in `;style1;style2;prop1=value1;.....`.
This is documented in the [mxStylesheet documentation](https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/src/js/view/mxStylesheet.js#L33-L38).
> To override the default style for a cell, add a leading semicolon to the style definition, e.g. ;shadow=1

From version 0.11.0 of `maxGraph`, you can replicate this behavior by setting `ignoreDefaultStyle` to `true` in the `CellStyle` object.


### Codecs

:::warning

From version 0.6.0 of `maxGraph`, codecs supplied by maxGraph are no longer registered by default, they ** MUST** be registered before performing an `encode` or `decode`

For example:
- You can use the `registerCoreCodecs` function (or other related functions) to register codecs.
- To serialize the `maxGraph` model, you can use the `ModelXmlSerializer` class, which registers codecs under the hood.

:::

## Conclusion

By following these guidelines and updating your codebase accordingly, you should be able to migrate your application from `mxGraph` to `maxGraph`.
Remember to test your application thoroughly after the migration to ensure that its functionality is preserved.
If you encounter any problems during the migration process, please refer to the `maxGraph` documentation or ask the `maxGraph` community for help.
