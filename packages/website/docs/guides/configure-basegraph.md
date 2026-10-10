---
sidebar_position: 10
description: Start a new application on BaseGraph and register exactly the plugins and style elements it needs.
---

# Set Up an Application on BaseGraph

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::

**Goal**: start a new application on [`BaseGraph`](../usage/graph.md#basegraph) and register exactly what it needs, so
that nothing it does not use ever reaches its bundle.

This guide was written and verified with `maxGraph` 0.25.0. Earlier versions are not covered.

[Reduce the Bundle Size of an Application](./reduce-bundle-size.md) covers the opposite direction, an application
already built on `Graph` and moved over. Follow that one if this is your case: it starts from everything and removes
progressively, which is the safer order when the application already works.

## Before you start

- **`@maxgraph/core` installed, and a build that runs**, since every step below ends by checking the result.
- **A container element with an explicit size in your page**, since a container of zero height shows nothing whatever
  the graph does.
- **The list of interactions the application offers**: selecting, moving, editing a label in place, panning, rubber
  band, context menu. Step 2 turns it into a list of plugins.
- **The cell styles you are going to write**, including the named styles you will put in the `Stylesheet`. Step 3 turns
  them into registrations.

This guide assumes you know how the two graph classes differ, see
[Graph vs BaseGraph](../usage/graph.md#graph-vs-basegraph).

## 1. Start from the bare graph

```typescript
import { BaseGraph } from '@maxgraph/core';

const container = document.getElementById('graph-container')!;
const graph = new BaseGraph({ container });

// Two vertices and an edge, so that each step below has something to look at.
// They deliberately name style elements that nothing registers yet, which step 3 fixes.
const source = graph.insertVertex({ value: 'source', position: [20, 20], size: [100, 40] });
const target = graph.insertVertex({ value: 'target', position: [260, 140], size: [100, 40],
  style: { shape: 'ellipse', perimeter: 'ellipsePerimeter' } });
graph.insertEdge({ source, target, style: { edgeStyle: 'orthogonalEdgeStyle' } });
```

This graph registers no shape, no perimeter, no edge style and no edge marker, and loads no plugin. It still draws
vertices and edges, since the renderer falls back to `RectangleShape` and `ConnectorShape` when a shape name resolves
to nothing, and the graph API is the same as with `Graph`, so inserting cells and reading the model work already.

What is missing is everything the user does with the mouse, and it is missing quietly. Clicking a cell does change the
selection, because that behavior belongs to the graph itself rather than to a plugin, but nothing draws it: the
selection border and the handles come from `SelectionCellsHandler`, which is not loaded. Expect a diagram that renders
and does not react.

Two examples of the maxGraph repository stop exactly here,
[ts-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-without-defaults) and
[js-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-without-defaults).
Both deliberately write styles naming an `ellipse` shape, an `ellipsePerimeter` and an `orthogonalEdgeStyle` that
nothing registers, which is the quickest way to see what each missing family costs on screen.

The steps below add back what the application needs, and nothing else. Take them in this order and check the
application between two of them, so that a regression points at the step you have just done.

## 2. Add the plugins for the interactions you offer

Plugins are passed as classes, not instances, in the `plugins` option, and the list is fixed once the graph is built.
Step 3 offers to put the style registrations in a `BaseGraph` subclass, so decide that now if you want it: the
constructor you write here is then `new ApplicationGraph({ ... })` rather than `new BaseGraph({ ... })`.

The order of the list does not matter, and no built-in plugin requires another one: every plugin looking another one up
does it through `getPlugin`, which returns `undefined` rather than throwing.

```typescript
// CellEditorHandler is one of the four plugins that need the stylesheet shipped by the package.
// See below.
import '@maxgraph/core/css/common.css';
import {
  BaseGraph,
  CellEditorHandler,
  SelectionCellsHandler,
  SelectionHandler,
} from '@maxgraph/core';

const graph = new BaseGraph({
  container,
  plugins: [CellEditorHandler, SelectionCellsHandler, SelectionHandler],
});
```

Pick them from the [Available Plugins](../usage/plugins.md#available-plugins) table, using the
[Kind column](../usage/plugins.md#what-the-kind-column-means) to know what each one buys you: a `Behavior` plugin works
as soon as it is in the list, while an `API` one does nothing until the application calls it.

Three points decide most of the list:

- **`SelectionCellsHandler` is what makes a selection visible.** It creates one
  [cell handler](../usage/cell-handlers.md) per selected cell, which draws the selection border. Without it the model
  still has a selection and the user cannot see it. The handles come on top of that: the resize handles need
  `SelectionHandler` as well, and the rotation handle needs `VertexHandlerConfig.rotationEnabled`, which is `false` by
  default. Dragging a cell to move it is `SelectionHandler` too, not a handle.
- **Four plugins do nothing until the application switches their feature on**, and each call is useless without its
  plugin in the list, so the two decisions have to be taken together. See
  [The plugins you must switch on](../usage/plugins.md#the-plugins-you-must-switch-on) for the four and the call each
  one needs.
- **Some plugins need the stylesheet shipped by the package**, which the `Requires loading CSS` mention of the table
  flags per plugin. Import `@maxgraph/core/css/common.css`, or write the equivalent rules yourself, see
  [CSS and Images](../usage/css-and-images.md#css).

One limit is worth knowing at this point, since this guide is about shipping nothing unused: `SelectionCellsHandler`
imports the four cell handler classes whichever edge styles you register, as the
[Plugins](../usage/tree-shaking.md#plugins) section explains.

The same goes for the alignment guides, which `SelectionHandler` displays while cells are moved. They are disabled by
default, with `BaseGraph` as with `Graph`, and enabled with `guidesEnabled` on the plugin instance. `SelectionHandler`
imports the `Guide` class whether they are enabled or not, so registering the plugin ships it anyway. See
[Alignment Guide](../usage/alignment-guide.md) to enable and customize them.

Writing your own plugin, rather than adding a behavior around the graph, is covered by
[When a plugin is the right tool](../usage/plugins.md#when-a-plugin-is-the-right-tool).

## 3. Register the style elements your cells name

Every style element is looked up by name in a global registry at paint time, so what has to be registered is exactly
what the styles of the application name. Go through them family by family: `shape`, then `perimeter`, `edgeStyle`, and
finally `startArrow` and `endArrow`. Do not forget the named styles you register with `putCellStyle`, and the styles
that arrive in XML at runtime.

An application drawing rectangles and ellipses joined by orthogonal edges registers this much, and nothing else:

```typescript
import {
  EdgeMarker,
  EdgeMarkerRegistry,
  EllipseShape,
  Perimeter,
  PerimeterRegistry,
  registerOrthogonalEdgeStyle,
  ShapeRegistry,
} from '@maxgraph/core';

ShapeRegistry.add('ellipse', EllipseShape);
PerimeterRegistry.add('ellipsePerimeter', Perimeter.EllipsePerimeter);
// Named by the default vertex style of the Stylesheet, not by your cells, see below
PerimeterRegistry.add('rectanglePerimeter', Perimeter.RectanglePerimeter);
registerOrthogonalEdgeStyle();
// Named by the default edge style of the Stylesheet, same reason
EdgeMarkerRegistry.add('classic', EdgeMarker.createArrow(2));
```

Each family has its own section in the reference page, with the registry, the imports and the traps:
[shapes](../usage/tree-shaking.md#shapes), [perimeters](../usage/tree-shaking.md#perimeters),
[edge styles](../usage/tree-shaking.md#edgestyles) and [edge markers](../usage/tree-shaking.md#edge-markers).

A named style is not a registration. It is a call made on the graph once it exists, and a cell opts into it by name:

```typescript
graph.getStylesheet().putCellStyle('highlighted', { fillColor: '#FFE6CC', strokeWidth: 2 });

graph.insertVertex({ value: 'a vertex', position: [20, 20], size: [120, 40],
  style: { baseStyleNames: ['highlighted'] } });
```

What has to be registered is only what the properties of such a style name.

Three things are worth knowing before you start, because they are not visible in the styles you write.

**Two names come from the `Stylesheet` rather than from your cells.** Its default vertex style names
`perimeter: 'rectanglePerimeter'` and its default edge style names `endArrow: 'classic'`, and both apply to every cell
that neither overrides them nor sets `ignoreDefaultStyle: true`. Register those two, or replace the defaults so that
they name something you already register:

```typescript
// Before inserting any cell: a cell already drawn keeps its style until the next graph.refresh()
const stylesheet = graph.getStylesheet();

const defaultVertexStyle = stylesheet.getDefaultVertexStyle();
defaultVertexStyle.perimeter = 'ellipsePerimeter'; // assumes the application registers it, and draws ellipses

const defaultEdgeStyle = stylesheet.getDefaultEdgeStyle();
defaultEdgeStyle.endArrow = 'none'; // the one value that names no marker, so nothing has to be registered
```

Each accessor returns the object the `Stylesheet` holds, so assigning to one property changes that default in place and
leaves the others alone.

Replacing a name is not the only option, and the two lines above do not save the same way. `'none'` names no marker, so
it removes a registration outright. `'ellipsePerimeter'` is a perimeter like any other and still has to be registered,
so repointing the default pays off only for an application that registers it anyway, and the name has to match the
shapes its cells draw: an ellipse perimeter on a rectangular vertex computes the attach point on an ellipse that is not
there, and the edge visibly meets the vertex in the wrong place.

A perimeter can also be dropped rather than replaced, by setting the property to `null` or `undefined`, which registers
nothing at all. Every edge then meets its terminals at their centre, see
[Disabling the Perimeter](../usage/perimeters.md#disabling-the-perimeter). Do it deliberately: that same rendering is
the second symptom listed in step 5 when it comes from a registration you forgot.

**Two shape names need nothing.** The fallbacks of step 1 mean a diagram made of plain rectangles and plain edges
registers no shape at all. That fallback is also why a missing registration is silent: the cell is drawn, with the
wrong appearance.

**An edge style is registered through its own helper**, `registerOrthogonalEdgeStyle` and its siblings, rather than
through a raw `EdgeStyleRegistry.add()` call. The helper also sets three pieces of metadata the library reads
elsewhere: which [edge handler](../usage/cell-handlers.md#choosing-the-handler-of-an-edge) to instantiate when the edge
is selected, whether the routing is orthogonal, which the view uses to compute where the edge meets its terminals, and
whether the handler offers intermediate handles. A raw registration routes the edge and leaves the three at their
defaults.

A shape of your own is registered in the same registry, under a name of your choice, see
[Adding a new custom `Shape`](./extend-maxgraph.md#adding-a-new-custom-shape).

### Where that code lives

Two places, equivalent for the bundle since the registries are global either way: a `registerDefaults()` override in a
`BaseGraph` subclass, or a function called once at startup, before the first graph is built. Both are shown in full,
imports included, in
[Registering style elements with BaseGraph](../usage/graph.md#registering-style-elements-with-basegraph), and
[Where the registration code lives](../usage/tree-shaking.md#where-the-registration-code-lives) compares them. The
subclass carries one constraint, detailed there: `registerDefaults()` runs before any field of your subclass and any
collaborator exists, so keep it to registry calls.

## 4. Review the global opt-ins

These are independent of the graph class, and each has its own switch. Decide them in this order, opting in only where
the application needs it:

- **Codecs**, if it reads or writes XML, see [Codecs](../usage/codecs.md);
- **i18n**, if it displays translated messages, see [i18n](../usage/i18n.md);
- **The logger**, which defaults to doing nothing.

[Register Only What You Use](../usage/tree-shaking.md#register-only-what-you-use) gives the narrow registration to
prefer for each, and [What Not to Load](../usage/tree-shaking.md#what-not-to-load) lists the imports that silently
inflate an application.

## 5. Check what the diagram is missing

A missing registration never throws, it degrades the rendering. The symptom of each one is listed in
[Check for over-trimming](./reduce-bundle-size.md#6-check-for-over-trimming): the fallback shape, an edge reaching
the centre of a vertex, a straight line instead of a routing, a missing arrow head, or the wrong handler on a selected
edge.

Review the diagrams visually, including the styles used only by rarely opened screens, which is where a forgotten
registration usually hides.

## What a configured application looks like

[ts-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-selected-features)
and
[js-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-selected-features)
are the end of this road: a `BaseGraph` subclass registering its handful of style elements, and a short plugin list,
about half the defaults plus `RubberBandHandler`, which is not one of them. Both are built by
`./scripts/build-all-examples.bash`, which prints the size each one reaches.
