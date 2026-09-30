---
sidebar_position: 30
description: 'How-to extend maxGraph: override existing behavior, add a custom Shape, declare your own Cell style properties.'
---

# Extend maxGraph

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::

## Introduction

This page is a collection of independent recipes, written for a developer who already builds graphs with `maxGraph`
and now needs to change something the API does not expose as an option. Read the section that matches your case, each
one links the concepts it uses.

`maxGraph` is meant to be extended, and most of its extension points have a page of their own:

- [EdgeStyles](../usage/edge-styles.md), to use the built-in ones and register your own connectors
- [Perimeters](../usage/perimeters.md), same for the perimeter of a vertex
- Custom shapes are covered by this page, in [Adding a new custom `Shape`](#adding-a-new-custom-shape); they are registered in the `ShapeRegistry`, listed with the other style registries in [Global Configuration](../usage/global-configuration.md#styles)
- [Cell Handlers](../usage/cell-handlers.md), to change how selected vertices and edges are manipulated
- [Plugins](../usage/plugins.md), to add your own behavior to a graph instance
- [Codecs](../usage/codecs.md), to control how your own objects are serialized to and from XML
- [Image Bundles](../usage/image-bundles.md), to map the short keys used in cell styles to images
- [Global Configuration](../usage/global-configuration.md), for the registries these extension points write to and their global state, and [Tree-Shaking](../usage/tree-shaking.md) to register only what your application actually uses
- [Reduce the Bundle Size of an Application](./reduce-bundle-size.md), to move an existing application to `BaseGraph` step by step

This page gathers what those pages do not cover: overriding the behavior that no factory exposes, writing a custom `Shape`, and declaring your own properties on the `Cell` style. Other subjects will be added here as they arise.

## Overriding existing behavior

Before overriding anything, look for a dedicated extension point, because most behaviors have one and using it survives
upgrades:

- **behavior added to a graph instance** belongs in a [Plugin](../usage/plugins.md);
- the **collaborators** of a `BaseGraph`, its `cellRenderer`, `model`, `selectionModel`, `stylesheet` and `view`, are
  constructor options (since 0.18.0), so replacing one needs no subclass at all:

  ```typescript
  const graph = new BaseGraph({ container, cellRenderer: new MyCustomCellRenderer() });
  ```

- **global defaults** live in the configuration objects listed in [Global Configuration](../usage/global-configuration.md);
- the **cell handlers** are chosen by factories carried by the `SelectionCellsHandler` plugin, see
  [Configuring the handler factories](../usage/cell-handlers.md#configuring-the-handler-factories). Since 0.25.0,
  customizing them no longer requires subclassing the graph.

The rest of this section is for what those do not reach.

### Choosing between a subclass and an instance patch

Both techniques below change the same members, so the question is not which is cleaner but which one is possible.
Patching one instance is the lighter option, and it is enough for a one-off adjustment on a graph you hold. A subclass
becomes mandatory in these cases:

| Situation | Why a patch cannot do it |
|---|---|
| `maxGraph` creates the object, not you | What you register is a class, or a factory, so there is no instance to patch |
| The member is read while the constructor runs | The object does not exist yet, and a subclass field is installed too late |
| The member is `protected`, or it is a `static` such as `pluginId` | TypeScript rejects the assignment on an instance, and a static has no instance equivalent |
| The same customization is needed in more than one place | Patching duplicates the body at each site |

The first two rows deserve a sentence more.

A cell handler is created per selected cell, a `Shape` by the renderer, a plugin by the graph constructor. A plugin is
the one that can still be reached afterwards, through `getPlugin`, since the graph keeps it, but not before its
constructor has run.

"Installed too late" means installed once `super()` has returned, so a member read during construction still sees the
base implementation. What works there is overriding the **method**, which lives on the prototype and is therefore in
place from the first line of the base constructor. On a graph class that rules out the mixin members and the accessors,
which are declared as properties, but not the five `create*` factories nor `registerDefaults()`, which are methods, see
[A graph class](#a-graph-class).

The last case of the table is the most common in practice, and the stories show it: a `ConstraintHandler` subclass is reused by two
unrelated collaborators, the connection handler and the edge handler. Both build it in their own constructor, and an
edge handler is created per selected cell, so there is no instance to patch in time.

```typescript
class MyCustomConstraintHandler extends ConstraintHandler {
  constructor(graph: AbstractGraph) {
    super(graph);
    this.pointImage = new ImageBox('./images/dot.gif', 10, 10);
  }
}

class MyCustomConnectionHandler extends ConnectionHandler {
  protected override createConstraintHandler(): ConstraintHandler {
    return new MyCustomConstraintHandler(this.graph);
  }
}

class CustomEdgeHandler extends EdgeHandler {
  protected override createConstraintHandler(): ConstraintHandler {
    return new MyCustomConstraintHandler(this.graph);
  }
}
```

That example is taken from a story which also shows the other side of the choice, since it patches
`graph.getAllConnectionConstraints` and the `isConnectableCell` method of its connection handler on their instances:

- live demo: [PortRefs](https://maxgraph.github.io/maxGraph/demo/?path=/story/connections-portrefs--default)
- source code: [PortRefs.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/PortRefs.stories.ts)

Everything else is fair game for a patch, in particular the members installed by the mixins and the public methods
called lazily rather than during construction.

### Subclassing

Subclassing is the supported way to change a behavior, and the one the Storybook stories use. What differs from one
class to the next is how the subclass is installed, and, for the graph classes alone, how the member has to be
declared, see [A graph class](#a-graph-class).

#### A plugin

A [plugin](../usage/plugins.md) is registered under the `pluginId` declared by its class, and a subclass inherits that static, so passing the
subclass in the `plugins` option replaces the built-in one:

```typescript
import {
  CellEditorHandler,
  ConnectionHandler,
  Graph,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
} from '@maxgraph/core';
import type { Cell, CellStateStyle, InternalMouseEvent } from '@maxgraph/core';

class MyCustomSelectionHandler extends SelectionHandler {
  // Application specific: a cell is a part when its style says so
  private isPart(cell: Cell | null): boolean {
    if (!cell) return false;
    // Declaring `constituent` on CellStateStyle, rather than casting here,
    // is covered in Extending the `Cell` style below
    const style = this.graph.getCurrentCellStyle(cell) as CellStateStyle & {
      constituent?: boolean;
    };
    return style.constituent === true;
  }

  // Redirects the start of a drag to the parent cell
  override getInitialCellForEvent(me: InternalMouseEvent) {
    const cell = super.getInitialCellForEvent(me);
    return this.isPart(cell) ? (cell?.getParent() ?? null) : cell;
  }
}

const graph = new Graph(container, undefined, [
  CellEditorHandler,
  SelectionCellsHandler,
  ConnectionHandler,
  MyCustomSelectionHandler,
  RubberBandHandler,
]);
```

`constituent` in that snippet is a style property of the application, not of `maxGraph`. Declaring it on
`CellStateStyle` rather than casting is covered by [Extending the `Cell` style](#extending-the-cell-style).

Two distinct things happen here. The subclass inherits the `pluginId` of `SelectionHandler`, so
`getPlugin('SelectionHandler')` returns your instance and anything reaching the plugin by its id gets the new behavior.
And the built-in `SelectionHandler` is absent from the graph simply because the list given to the constructor replaces
the default one entirely, not because the subclass displaced it. Name every plugin the graph needs, not only yours, see
[Choosing the Plugins to Use](../usage/plugins.md#choosing-the-plugins-to-use), and never pass both the built-in and
your subclass. The graph stores its plugins in a map keyed by `pluginId`, so both are constructed and both register
their listeners, then the second one silently takes the key: the first becomes unreachable through `getPlugin` and
never receives `onDestroy()`, since `destroy()` iterates the map.

Writing a plugin of your own, rather than subclassing a built-in one, is the way to attach a behavior to a graph: the
graph releases it on `destroy()`, and anything holding the graph reaches it with `getPlugin`. See
[When a plugin is the right tool](../usage/plugins.md#when-a-plugin-is-the-right-tool).

#### A cell handler

[Cell handlers](../usage/cell-handlers.md), `VertexHandler`, `EdgeHandler`, `ElbowEdgeHandler` and
`EdgeSegmentHandler`, are not [plugins](../usage/plugins.md): one is created per selected cell. Since 0.25.0 they come from factories carried by the `SelectionCellsHandler` plugin:

```typescript
class MyCustomVertexHandler extends VertexHandler {
  // the overrides that change how a selected vertex is manipulated
}

graph
  .getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!
  .setVertexHandlerFactory((state) => new MyCustomVertexHandler(state));
```

`setEdgeHandlerFactory(kind, factory)` does the same per kind, `'default'`, `'elbow'`, `'segment'` or a kind of your
own registered with an `EdgeStyle`, and `setEdgeHandlerFactoryForAllKinds(factory)` sets a single factory for all of
them. A factory only affects the handlers created after the call. See
[Configuring the handler factories](../usage/cell-handlers.md#configuring-the-handler-factories).

#### A collaborator

[`Graph`](../usage/graph.md) builds its `CellRenderer`, `GraphView`, `GraphDataModel`, `GraphSelectionModel`
and `Stylesheet` through factory methods, so a subclass replaces any of them:

```typescript
import { CellRenderer, Graph } from '@maxgraph/core';

import { MyCustomCellRenderer } from './MyCustomCellRenderer';

class MyGraph extends Graph {
  override createCellRenderer(): CellRenderer {
    return new MyCustomCellRenderer();
  }
}
```

The others are `createGraphView`, `createGraphDataModel`, `createSelectionModel` and `createStylesheet`.

`registerDefaults()` and these five are all called while the constructor of `AbstractGraph` is executing, the factories
through `initializeCollaborators`, which `Graph` implements, and two of them conditionally: `createGraphDataModel` and
`createStylesheet` run only when the constructor received neither a model nor a stylesheet, those arguments taking
precedence. The override itself works, being a method on the prototype, but no field of the subclass exists at that
point, so a factory reading one reads `undefined` and nothing is reported. Keep them free of instance state, which
[Where the registration code lives](../usage/tree-shaking.md#where-the-registration-code-lives) details for
`registerDefaults()`.

[`BaseGraph`](../usage/graph.md#basegraph) has no such factory methods, it takes the collaborators as constructor
options instead (since 0.18.0).
Note that `cellRenderer`, `model` and `stylesheet` are instances, while `selectionModel` and `view` are functions
receiving the graph, because they need it at construction time:

```typescript
const graph = new BaseGraph({
  container,
  cellRenderer: new MyCustomCellRenderer(),
  view: (graph) => new MyCustomGraphView(graph),
});
```

:::info
These options belong to `BaseGraph`. The constructor of `Graph` is positional, `(container, model, plugins,
stylesheet)`, so a `Graph` accepts its model and its stylesheet as arguments, and replacing those two needs no
subclass. Its `CellRenderer`, `GraphView` and `GraphSelectionModel` have no such parameter, so overriding the factory
methods above is the only way to have your own in place before the constructor finishes. The fields themselves are
public and writable, but assigning one afterwards means the view has already been built and initialized with the
replaced object.
:::

#### A graph class

Subclassing [`Graph`, `BaseGraph` or `AbstractGraph`](../usage/graph.md) carries a caveat of its own, because of how
their API is assembled.

Most of that API is installed by [mixins](../usage/tree-shaking.md#going-further), the internal mechanism that groups
the features of `AbstractGraph` by subject. You call those members like any other, but a mixin declares nearly all of
them as a property holding a function rather than as a method, and a subclass must match that shape. The override is
therefore a property initialized with an arrow function. `insertVertex` and `insertEdge` are the exceptions, declared as
overloaded methods and overridden as methods:

```typescript
import { Graph } from '@maxgraph/core';
import type { Cell } from '@maxgraph/core';

class MyGraph extends Graph {
  override isCellEditable = (cell: Cell): boolean => {
    return super.isCellEditable(cell) && !cell.isEdge();
  };
}
```

Writing the same override as a method does not compile:

```typescript
class MyGraph extends Graph {
  // error TS2425: Class 'Graph' defines instance member property 'isCellEditable',
  // but extended class 'MyGraph' defines it as instance member function.
  override isCellEditable(cell: Cell): boolean {
    return super.isCellEditable(cell) && !cell.isEdge();
  }
}
```

The dividing line is not the mixins as such, it is how the member is declared, and the graph classes use both forms:

| Declared as | Examples | Override as | `super` |
|---|---|---|---|
| A method | the five factory methods of `Graph`, `getWarningImage` | A method | Works |
| A property holding a function | the mixin members such as `isCellEditable`, and about twenty accessors `AbstractGraph` declares for itself, `getContainer`, `getPlugin`, `getCellRenderer`, `getPageFormat` and their siblings | A property, as above | Works for the mixin members only |

For the accessors `AbstractGraph` declares itself, `super` is not available: they are class fields, which live on the
instance rather than on the prototype, so `super.getContainer()` is rejected with
`error TS2855: Class field 'getContainer' defined by the parent class is not accessible in the child class via super`.
Read the underlying state instead, `this.container` in that example. The mixin members are exempt because the mixin
mechanism installs them on the prototype, so `super.isCellEditable(cell)` resolves normally.

Both forms are visible in the [Constituent story](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Constituent.stories.ts),
which overrides `selectCellForEvent` as a property and declares its own `isPart` as a method.

Mixins also have a cost on the bundle, see [Going Further](../usage/tree-shaking.md#going-further).

:::info
This applies to the graph classes only. Plugins, cell handlers, shapes, `CellRenderer` and `GraphView` are ordinary
classes, and their methods are overridden as methods.
:::

:::warning
A property override is installed on the instance only once `super()` has returned, so a call made from the constructor
of the base class still runs the original implementation.
:::

### Patching a single instance

Every public member is writable, so one object can be adjusted without declaring a class. This is convenient when a
single graph needs the change, and it is one of the two ways to reach a value that is a field rather than a method, the
other being a subclass declaring the same field, see the next section.

It applies to the graph:

```typescript
graph.isCellEditable = (cell) => !cell.isEdge();
```

to its plugins, retrieved with [`getPlugin`](../usage/plugins.md#retrieving-and-using-a-plugin), which returns
`T | undefined`:

```typescript
const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler')!;
tooltipHandler.getTooltipForCell = () => 'Double-click and right- or shift-click';
```

and to its collaborators, reachable as `graph.view`, `graph.cellRenderer`, `graph.model` or through `getView()`,
`getCellRenderer()`, `getDataModel()` and `getStylesheet()`.

Use a `function` expression rather than an arrow when the replacement needs `this`, since an arrow captures the
enclosing scope instead of the patched object:

```typescript
const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler')!;
tooltipHandler.getTooltip = function (state) {
  return this.graph.getLabel(state.cell);
};
```

Bind the previous implementation when the override only narrows it, otherwise the call loses its `this`:

```typescript
const wasCellEditable = graph.isCellEditable.bind(graph);
graph.isCellEditable = (cell) => wasCellEditable(cell) && !cell.isEdge();
```

### Patching a prototype

:::warning
`mxGraph` documented prototype patching, and `maxGraph` inherited that advice in places, but it is neither recommended
nor supported here. For a field it silently does nothing.
:::

`maxGraph` is written with ES classes, which splits the API in two:

- a **method** declared in a class body lives on the prototype, so assigning to `SomeClass.prototype.someMethod`
  replaces it for every instance, including the instances `maxGraph` creates internally;
- a **field** declared with an initializer does not. The emitted code assigns it in the constructor, so every instance
  owns the property and shadows whatever the prototype carries.

`EdgeHandler` declares `snapToTerminals = false`, which compiles to `this.snapToTerminals = false` in the constructor.
Patching the prototype therefore has no effect, and no error is reported:

```typescript
// Does nothing: the constructor of every EdgeHandler overwrites it with false.
EdgeHandler.prototype.snapToTerminals = true;
```

In `mxGraph` the same line worked, because `mxEdgeHandler.prototype.snapToTerminals = false` really was a property of
the prototype
([mxEdgeHandler.js](https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/src/js/handler/mxEdgeHandler.js#L205)).
Porting that idiom is the one migration step that fails quietly rather than loudly.

To change such a value, use the [global configuration](../usage/global-configuration.md) object when one covers it, otherwise
assign it on the instance you own, or declare a subclass and plug it in through the matching factory:

```typescript
class MyEdgeHandler extends EdgeHandler {
  override snapToTerminals = true;
}

const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
selectionCellsHandler.setEdgeHandlerFactoryForAllKinds((state) => new MyEdgeHandler(state));
```

A field is enough here, although the table of
[Choosing between a subclass and an instance patch](#choosing-between-a-subclass-and-an-instance-patch) warns against
one, because `snapToTerminals` is read on each mouse event rather than while the constructor runs.

### Examples and Demos of overriding

Subclassing a handler and the graph together, to treat a child cell as a part of its parent:

- live demo: [Constituent](https://maxgraph.github.io/maxGraph/demo/?path=/story/layouts-constituent--default)
- source code: [Constituent.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Constituent.stories.ts)

Subclassing several core classes at once, `SelectionHandler`, `ConnectionHandler`, `CellRenderer`, `GraphView` and
`Graph`:

- live demo: [Scrollbars](https://maxgraph.github.io/maxGraph/demo/?path=/story/misc-scrollbars--default)
- source code: [Scrollbars.stories.js](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Scrollbars.stories.js)

Patching a single instance, narrowing nine permission methods while keeping the previous implementation of each:

- live demo: [Permissions](https://maxgraph.github.io/maxGraph/demo/?path=/story/misc-permissions--default)
- source code: [Permissions.stories.js](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Permissions.stories.js)

## Adding a new custom `Shape`

A shape is a class registered in the [`ShapeRegistry`](../usage/global-configuration.md#styles) under a name, which
cell styles then reference through their `shape` property.

### Choosing the base class

| What you draw | Extend | Method to override |
|---|---|---|
| One or several paths, drawn from scratch | `Shape` | `paintVertexShape`, drawing between `begin()` and `fillAndStroke()` |
| A filled area plus a stroke only overlay | `CylinderShape` | `redrawPath(c, x, y, w, h, isForeground)` |
| A decorated rectangle | `RectangleShape` | `paintBackground` or `paintForeground`, and `paintVertexShape` to replace both |
| A decorated ellipse | `EllipseShape` | `paintVertexShape` only |
| An edge | `ConnectorShape`, `PolylineShape`, `ArrowShape`, `ArrowConnectorShape` | `paintEdgeShape(c, pts)` |

`CylinderShape` is the only base class whose `redrawPath` takes the extra `isForeground` parameter, because it calls the
method twice: once for the filled background, then once with `isForeground` set to `true` for a path that is only
stroked.

The two decorated rows differ for a reason worth knowing before you pick one. `paintBackground` and `paintForeground`
are declared on `Shape` and called by `Shape.paintVertexShape`, so overriding either works on every shape that keeps
that implementation, `RectangleShape` among them. It does nothing on a shape that replaces `paintVertexShape` and paints
directly: such an override is accepted by the compiler, carries `override` legitimately, and is never executed.
`EllipseShape` is the one that matters here, and `CylinderShape`, `RhombusShape`, `SwimlaneShape` and `LineShape` behave
the same way, as does the whole `AbstractPathShape` family, which covers `ActorShape`, `CloudShape`, `TriangleShape` and
`HexagonShape`. `ImageShape` sits in between: it replaces `paintVertexShape` as well, but the branch it takes for a cell
whose style sets no image calls `paintBackground`.

### Writing and registering the shape

Translate the canvas to the top left corner of the cell, then draw the path between `begin()` and `fillAndStroke()`:

```typescript
import type { AbstractCanvas2D } from '@maxgraph/core';
import { Shape, ShapeRegistry } from '@maxgraph/core';

class FoldedCornerShape extends Shape {
  override paintVertexShape(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const fold = Math.min(w, h) / 4;

    c.translate(x, y);
    c.begin();
    c.moveTo(0, 0);
    c.lineTo(w - fold, 0);
    c.lineTo(w, fold);
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.close();
    c.fillAndStroke();
  }
}

ShapeRegistry.add('foldedCorner', FoldedCornerShape);
```

Any cell can then use it:

```typescript
graph.insertVertex({
  value: 'a note',
  position: [20, 20],
  size: [120, 60],
  style: { shape: 'foldedCorner' },
});
```

If the name is not registered, nothing is logged: the renderer falls back to `RectangleShape` for a vertex and to
`ConnectorShape` for an edge. Note also that the `StencilShapeRegistry` is consulted first, so a stencil registered
under the same name wins over the shape.

:::warning
Registering under a name a built-in already uses is not a reliable way to replace it. `registerDefaultShapes()` is
guarded by a module level flag, and the constructor of `Graph` calls it, so the first `new Graph()` of the page
registers the built-ins and overwrites your entry, while the same registration made after that constructor wins and is
never undone. Which of the two happens depends on the order your modules run in, and nothing reports the loss. Register
under a name of your own instead, and name it in the style of the cells concerned.
:::

### What the renderer provides, and what a constructor must not do

The renderer instantiates a registered shape with `new CustomShape()`, **without any argument**, for vertices and edges
alike. So write no constructor at all. A parameter declared without a default value is never supplied on this path: it
arrives as `undefined`, and it is then assigned over the class field default of `Shape`. That is why
`new RectangleShape()` leaves `fill` and `stroke` at `undefined` rather than at `NONE`.

A parameter **with** a default value is the exception, since `undefined` is exactly what triggers that default. Prefer
a class field, which says the same thing without a constructor, and without parameters the renderer never supplies.

```typescript
class MyShape extends RectangleShape {
  // Useless, and misleading for whoever reads the class next:
  // the renderer supplies nothing, so the four parameters are always undefined
  constructor(bounds: Rectangle, fill: ColorValue, stroke: ColorValue, strokeWidth: number) {
    super(bounds, fill, stroke, strokeWidth);
  }
}
```

The built-in shapes still declare those `mxGraph` era parameters, because they are real for the other path: the
selection handles, the overlays and the previews construct `RectangleShape`, `EllipseShape`, `ImageShape` and
`PolylineShape` directly, with actual arguments.

Everything a shape needs is assigned after construction:

- `apply(state)` sets `state`, `style`, and the style derived fields such as `fill`, `stroke`, `strokeWidth` and
  `isRounded`;
- the renderer then sets `points` and `bounds` together, the bounds of the cell and an empty array for a vertex, the
  absolute points and `null` for an edge, whose bounds the shape recomputes from those points, and finally `scale`.

:::warning
Do not set style derived fields in a constructor to give your shape a default appearance. Those fields are reset to
their base values on every style change, so a value assigned once at construction time is lost as soon as the style of
the cell changes. Read the style in the paint methods instead, or reassert the default as described below.
:::

### Where a durable default belongs

Fields fall into three groups, depending on what becomes of a value assigned at construction time:

| Group | Examples | What happens to the assignment |
|---|---|---|
| Derived from the style | `fill`, `stroke`, `strokeWidth`, `isRounded`, `isDashed`, `opacity`, `spacing`, `direction`, `startSize`, `endSize`, `startArrow`, `endArrow` | Kept until the first style change, then reset to the base value |
| Owned by the renderer | `bounds`, `points`, `scale`, `state`, `style`, `imageSrc`, `dialect` | Reassigned by the renderer, so assigning them achieves nothing. `bounds`, `points` and `scale` on every redraw, `state`, `style` and `imageSrc` on creation and on each style change, `dialect` once when the shape is created |
| Assigned by nothing in the rendering path | `useSvgBoundingBox`, `svgStrokeTolerance`, `visible`, and any field your own subclass introduces | Durable, with two exceptions named below |

The three groups do not cover every field of `Shape`. `indicatorColor`, `indicatorStrokeColor`,
`indicatorGradientColor` and `indicatorImageSrc` belong to the second group, since `configureShape` assigns them on
creation and on every style change, while `indicatorDirection` is assigned only when the style names it, so a default
of your own survives there. `minSvgStrokeWidth` and `antiAlias` are set by the renderer on each shape it creates. And
the third group has two exceptions. `useSvgBoundingBox` is durable on a `Shape` subclass but not on a `ConnectorShape`
one, whose `updateBoundingBox` recomputes it from `style.curved` at every update. And `svgStrokeTolerance` is durable
on the shape that draws the cell, but `CellHighlight` builds a second instance of the same class through the renderer
and overwrites it, along with `stroke`, `opacity`, `isDashed` and `isShadow`. When in doubt about a field the table
does not name, search for it in `CellRenderer` and in the class you extend before relying on it.

The first group is the trap, because the mistake looks correct at first: the shape renders as intended when the diagram
loads, and reverts at the first style change, including one that has nothing to do with the field, such as a color set
through `setCellStyles`.

A field of the third group needs no constructor at all. Declare it as a class field with an initializer, the way
`CylinderShape` declares its `maxHeight`.

A default of the first group has to be declared **twice**, because two different paths reach the shape and only one of
them resets anything:

- when the shape is created, the renderer calls `apply(state)` and never calls `resetStyles()`, so the value comes from
  the class field;
- when the style of the cell changes afterwards, the renderer calls `resetStyles()`, which wipes the field, then
  `apply(state)`.

Declaring only the override therefore draws the base value until the first style change, and declaring only the field
loses it at that change:

```typescript
// Named once, since each default has to be written in both places
const STROKE_WIDTH = 3;
const IS_ROUNDED = true;

class ThickShape extends RectangleShape {
  // Covers the first render, which never calls resetStyles()
  override strokeWidth = STROKE_WIDTH;
  override isRounded = IS_ROUNDED;

  // Covers every later style change, which wipes both fields first
  override resetStyles(): void {
    super.resetStyles();
    this.strokeWidth = STROKE_WIDTH;
    this.isRounded = IS_ROUNDED;
  }
}
```

Calling `super.resetStyles()` **first** is mandatory, since the base implementation is what wipes the fields. And the
cell keeps the last word in both paths: `apply(state)` overwrites each field the style actually names and leaves the
others alone. So a cell styled with `strokeWidth: 5` draws with 5, and a cell that says nothing about it draws with
your 3. The two shapes of [ts-example](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example) are written
this way.

:::note
Patching the prototype of the shape is not an alternative, for the reason given in
[Patching a prototype](#patching-a-prototype): these fields are class fields, so every instance shadows the prototype
value at construction time.
:::

### Reading the style

A shape reads the style of the cell it draws through `this.style`, typed `CellStateStyle | null`, and reaches the cell
itself through `this.state.cell`. Both `style` and `state` are nullable, so guard them:

```typescript
const color = this.style?.fillColor;
```

Declaring your own style properties, so that a cell configures your shape the way it configures a built-in one, is
covered by [Extending the `Cell` style](#extending-the-cell-style) below.

### Edge shapes

There is no separate registry and no flag: `Shape.paint` dispatches on `points`, which the renderer fills for an edge
and leaves empty for a vertex. An edge shape therefore overrides `paintEdgeShape(c, pts)` and ignores the vertex paint
methods.

`augmentBoundingBox` is the hook that widens the bounding box of a shape painting outside its bounds, an arrow head for
instance, and the built-in `ConnectorShape`, `ArrowShape` and `ArrowConnectorShape` all override it. It is rarely
reached: `useSvgBoundingBox` defaults to `true`, and `updateBoundingBox` then takes the SVG `getBBox()` of the rendered
node, which already covers everything the shape painted, and returns before the hook. It runs on a shape whose flag is
`false`, `ConnectorShape` setting it from `style.curved` at each update, and on any shape whose SVG box is unavailable,
which covers a node not yet attached to an `ownerSVGElement`, an empty box, and a `getBBox()` that throws. Nothing is
clipped either way: the bounding box feeds `graph.getBoundingBox()`, the selection preview and the print preview, not
the painting.

### Tree-shaking

Registering a shape is what pulls its class into your bundle, so a custom shape costs exactly what it weighs, and
nothing else changes. Do not call `registerDefaultShapes()` to get your own registered, see
[Tree-Shaking](../usage/tree-shaking.md#shapes).

### Examples and Demos of custom shapes

A vertex shape extending `CylinderShape` to draw a 3D box, registered and applied through the default vertex style:

- live demo: [Shape](https://maxgraph.github.io/maxGraph/demo/?path=/story/shapes-shape--default)
- source code: [Shape.stories.js](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Shape.stories.js)

A custom edge shape extending `ArrowShape`, next to a custom vertex shape and a custom edge marker:

- live demo: [Markers](https://maxgraph.github.io/maxGraph/demo/?path=/story/icon-images-markers--default)
- source code: [Markers.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Markers.stories.ts)

A shape extending `Shape` directly and painting with the canvas API, alongside stencil shapes loaded from XML:

- live demo: [Stencils](https://maxgraph.github.io/maxGraph/demo/?path=/story/shapes-stencils--default)
- source code: [Stencils.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Stencils.stories.ts)

Two shapes decorating `RectangleShape` and `EllipseShape` in a complete application:
[ts-example](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example).


## Extending the `Cell` style

:::info[Since 0.25.0]
`CellStateStyle` and `CellStyle` are declared with `interface` instead of `type` since 0.25.0, which is what makes the
module augmentation described below possible. It requires **TypeScript 3.9** or higher, the minimum version
supported since 0.25.0, and silently does not work on TypeScript 3.8.
:::

### When custom style properties are useful

The style of a `Cell` is the natural place for anything that drives how that cell is drawn. Every extension point that renders receives it, so declaring your own properties on it lets a single cell configure your own code, the same way a built-in property configures a built-in shape:

- a **custom shape** reads `this.style`, typed `CellStateStyle | null`, so a property of yours turns a shape that hardcodes its appearance into one that is configured per cell, for instance a badge to draw in a corner, the number of sides of a polygon or the name of an icon;
- a **[custom perimeter](../usage/perimeters.md#custom-perimeter)** receives the `CellState` of the vertex and a **[custom edge style](../usage/edge-styles.md#custom-edgestyle)** the `CellState` of the edge, so both read their parameters from `state.style`;
- a **custom marker** receives the `Shape`, so it reads `shape.style` as well;
- **application data that must travel with the style** can live there too: the [codecs](../usage/codecs.md) encode and decode the whole style object, so a property of yours makes the round trip through XML, and a named style in the `Stylesheet` sets it once for many cells. Mind the types on the way back: the decoder turns every value that looks numeric into a number, so a `boolean` of yours is written as `1` or `0` and read back as the number `1` or `0`, and a string such as `'3'` comes back as `3`. Prefer a string value that cannot be read as a number, or convert on read.

Without such a declaration, the only ways to pass that value are to hardcode it in the shape, to reuse an unrelated built-in property for something it does not mean, or to reach the value through a cast, which gives up type checking exactly where a typo is most likely.

### Adding custom properties to the style types

`CellStateStyle` and `CellStyle` are declared as interfaces, so they support [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation). Declare your own properties once, in any file of your application that is a module:

```typescript
export {}; // only needed when the file has no other import or export

declare module '@maxgraph/core' {
  interface CellStateStyle {
    myCustomStyleProperty?: number;
    myCustomBooleanStyleProperty?: boolean;
  }
}
```

:::warning
That `export {}` is not decoration. A file with no top-level `import` or `export` is a script, and there
`declare module '@maxgraph/core'` declares a **new** module instead of augmenting the package, which silently replaces
its typings. Every import of the application then fails with `error TS2305: Module '"@maxgraph/core"' has no exported
member`, pointing at the import sites rather than at the file that caused it. A file that already imports or exports
something, as the shape example below does, is a module already and needs nothing.
:::

`CellStyle` extends `CellStateStyle`, so a property declared on `CellStateStyle` is visible on both: it is accepted in the style set on a Cell as well as in the computed state style.

```typescript
import type { CellStyle } from '@maxgraph/core';

const style: CellStyle = { shape: 'rectangle', myCustomStyleProperty: 42 };
```

Augment `CellStyle` directly when the property only makes sense on the style declared on a Cell, and not on the computed state style.

Declare the properties as optional (`?`), as `maxGraph` does for its own, otherwise every style object of your application has to set them.

### A shape configured by its own style property

A custom shape reading a property of its own from the style of the cell it draws, with the declaration that makes it type check:

```typescript
import type { AbstractCanvas2D } from '@maxgraph/core';
import { RectangleShape, ShapeRegistry } from '@maxgraph/core';

declare module '@maxgraph/core' {
  interface CellStateStyle {
    badgeColor?: string;
  }
}

class BadgedRectangleShape extends RectangleShape {
  override paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number): void {
    super.paintVertexShape(c, x, y, w, h);

    const badgeColor = this.style?.badgeColor;
    if (badgeColor) {
      c.setFillColor(badgeColor);
      c.ellipse(x + w - 8, y - 2, 10, 10);
      c.fillAndStroke();
    }
  }
}

ShapeRegistry.add('badgedRectangle', BadgedRectangleShape);
```

Each cell then chooses its own badge with `style: { shape: 'badgedRectangle', badgeColor: 'Crimson' }`, and the property is checked by the compiler like any built-in one.

### Keep your custom properties flat

Give each property a simple type, `number`, `string` or `boolean`, and declare each value as a property of its own rather than gathering several of them in one object. An array is fine as long as it holds those same simple types, which is what `maxGraph` does itself with `baseStyleNames: string[]`, the only array among its own style properties.

```typescript
declare module '@maxgraph/core' {
  interface CellStateStyle {
    // Avoid: a single property holding an object
    badge?: { color: string; size: number };
  }
}
```

```typescript
declare module '@maxgraph/core' {
  interface CellStateStyle {
    // Prefer: one property per value, a shared prefix showing they belong together
    badgeColor?: string;
    badgeSize?: number;
  }
}
```

The type system accepts both. What differs is the API that manipulates a style.

**A style is changed one key at a time.** `graph.setCellStyles(key, value, cells?)` takes a `keyof CellStateStyle` and assigns it at the top level of the style object, so no call reaches `badge.color`. Changing one field of an object of yours means reading the style, copying that object, changing the field and writing the whole object back, which is exactly what the one line call already does for a flat property.

**A style is cloned more often than it looks.** Every `setCellStyles` starts by cloning the style of each cell, with `Cell.getClonedStyle()`, and `Cell.clone()` does the same for the whole cell. That clone is a recursive copy written by hand, not `structuredClone`: it rebuilds each nested value by calling its constructor **with no argument**, then copies the enumerable properties. A plain object and an array survive it at any depth. Anything else does not:

| Value held by your property | What the clone gives back |
|---|---|
| A `Date` | The current date |
| A `Map` or a `Set` | An empty one |
| An object created with `Object.create(null)` | `null` |
| An instance of a class whose constructor requires an argument | Nothing, the clone throws, during an ordinary style change |

`CellState.clone()` is the other side of the same coin: it passes the style by reference rather than copying it, so the two states share whatever object it holds.

An array of simple values escapes both problems. It is copied into a new array with its contents, sparse arrays aside, and it is replaced as a whole by a single `setCellStyles` call, which is the only thing that call can do anyway.

A flat property has none of those failure modes, and a common prefix keeps the relationship visible: `badgeColor`, `badgeSize` and `badgePosition` read as one family while each of them stays settable in a single call.
