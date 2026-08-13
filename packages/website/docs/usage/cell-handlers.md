---
sidebar_position: 10
description: How-to use and configure the handlers that manage selected vertices and edges.
---

# Cell Handlers

## What is a Cell Handler?

A _cell handler_ is the object that provides the interactive controls displayed on a **selected** cell: the selection
border, the square handles used to resize a vertex or to bend an edge, the label handle, and so on.

Handlers are not part of the rendering of a cell. They exist only while a cell is selected:

- the `SelectionCellsHandler` plugin listens to selection changes,
- when a cell becomes selected, it creates a handler for it,
- when the cell is deselected, the handler is destroyed and its DOM elements are removed.

This means that **a graph without the `SelectionCellsHandler` plugin has no handlers at all**. This is the expected
setup for read-only or visualization-only applications, and it also keeps the handler classes out of the bundle. See
[Choosing the Plugins to Use](./plugins.md#choosing-the-plugins-to-use) and the
[Tree-Shaking](./tree-shaking.md) page.

maxGraph provides two families of handlers, both created by `SelectionCellsHandler`:

| Cell type | Handler |
|---|---|
| Vertex | `VertexHandler` |
| Edge | `EdgeHandler`, or one of its subclasses `ElbowEdgeHandler` and `EdgeSegmentHandler` |

## VertexHandler

`VertexHandler` manages a selected vertex. It provides:

- a **selection border** around the vertex,
- **resize handles**, one per corner and one per side,
- a **rotation handle**, disabled by default (see `VertexHandlerConfig.rotationEnabled` below),
- a **label handle**, when the label is movable (`graph.setVertexLabelsMovable(true)`),
- **custom handles**, an extension point for shape-specific controls. Subclasses override `createCustomHandles()` to
  return additional `CellHandle` instances, typically to edit a property of the shape directly on the diagram.

## EdgeHandler

`EdgeHandler` manages a selected edge. It provides:

- a **selection outline** along the edge,
- **terminal handles** at both ends, used to reconnect the edge to another vertex,
- **bend handles** on the waypoints, used to change the edge routing,
- a **label handle**, when the label is movable (`graph.setEdgeLabelsMovable(true)`),
- **virtual bends**, disabled by default: extra handles in the middle of each segment used to create new waypoints,
- **adding and removing bends with shift-click**, both disabled by default.

Two subclasses adapt this behavior to edges whose routing is computed by an `EdgeStyle`:

- `ElbowEdgeHandler`: for elbow-like routings, which expose a single intermediate handle.
- `EdgeSegmentHandler`: for segment-based routings, which expose one handle per computed segment.

Which one is used is not decided by the handler itself, but by the `EdgeStyle` of the edge. See
[Choosing the handler of an edge](#choosing-the-handler-of-an-edge).

## Global Configuration

Handlers are configured with three global object literals, exported by the package. They apply to **all** `Graph`
instances of the application, and are part of the
[global configuration](./global-configuration.md) of maxGraph.

:::warning
These objects are **experimental**. They are subject to change or removal in future versions without prior notice.
:::

Since they are plain objects, configuring them is a matter of assigning properties, before or after creating the
graph. Handlers read them when they are created, so a change only affects cells selected afterwards.

```typescript
import { EdgeHandlerConfig, HandleConfig, VertexHandlerConfig } from '@maxgraph/core';

HandleConfig.fillColor = '#99ccff';
VertexHandlerConfig.rotationEnabled = true;
EdgeHandlerConfig.virtualBendsEnabled = true;
```

### HandleConfig

Shared by `VertexHandler` and `EdgeHandler`, it configures the small squares used as handles. Available since `0.14.0`.

| Property | Default | Description |
|---|---|---|
| `fillColor` | `HANDLE_FILLCOLOR` | Fill color of the handles. Use `none` for no color. |
| `strokeColor` | `HANDLE_STROKECOLOR` | Stroke color of the handles. Use `none` for no color. |
| `size` | `HANDLE_SIZE` | Size of the handles. |
| `labelFillColor` | `LABEL_HANDLE_FILLCOLOR` | Fill color of the label handle. Use `none` for no color. |
| `labelSize` | `LABEL_HANDLE_SIZE` | Size of the label handle. |
| `labelCursor` (since `0.20.0`) | `'default'` | Cursor displayed over the label handle. |

### VertexHandlerConfig

Available since `0.12.0`.

| Property | Default | Description |
|---|---|---|
| `rotationEnabled` | `false` | Displays the rotation handle. |
| `selectionColor` | `VERTEX_SELECTION_COLOR` | Color of the selection border. Use `none` for no color. |
| `selectionDashed` (since `0.14.0`) | `VERTEX_SELECTION_DASHED` | Dashed state of the selection border. |
| `selectionStrokeWidth` (since `0.14.0`) | `VERTEX_SELECTION_STROKEWIDTH` | Stroke width of the selection border. |
| `cursorMovable` (since `0.20.0`) | `'move'` | Cursor displayed over a movable vertex. |

### EdgeHandlerConfig

Applies to `EdgeHandler` and its subclasses. Available since `0.14.0`.

| Property | Default | Description |
|---|---|---|
| `handleShape` | `'square'` | Shape of the edge handles: `'square'` or `'circle'`. |
| `connectFillColor` | `CONNECT_HANDLE_FILLCOLOR` | Fill color of the connect handle. Use `none` for no color. |
| `selectionColor` | `EDGE_SELECTION_COLOR` | Color of the selection outline. Use `none` for no color. |
| `selectionDashed` | `EDGE_SELECTION_DASHED` | Dashed state of the selection outline. |
| `selectionStrokeWidth` | `EDGE_SELECTION_STROKEWIDTH` | Stroke width of the selection outline. |
| `virtualBendsEnabled` (since `0.15.0`) | `false` | Adds a virtual bend in the center of each segment, used to create new waypoints. |
| `virtualBendOpacity` (since `0.15.0`) | `20` | Opacity of the virtual bends. |
| `addBendOnShiftClickEnabled` (since `0.15.0`) | `false` | Adds a bend when shift-clicking an edge. |
| `removeBendOnShiftClickEnabled` (since `0.15.0`) | `false` | Removes a bend when shift-clicking it. |
| `cursorBend` (since `0.20.0`) | `'crosshair'` | Cursor displayed over a movable bend. |
| `cursorMovable` (since `0.20.0`) | `'move'` | Cursor displayed over a movable edge. |
| `cursorTerminal` (since `0.20.0`) | `'pointer'` | Cursor displayed over a terminal handle. |
| `cursorVirtualBend` (since `0.20.0`) | `'crosshair'` | Cursor displayed over a movable virtual bend. |

:::note
`addBendOnShiftClickEnabled` and `removeBendOnShiftClickEnabled` are experimental and not recommended for production
use.
:::

### Resetting the configuration

Each object has a matching reset function restoring the default values: `resetHandleConfig`,
`resetVertexHandlerConfig` and `resetEdgeHandlerConfig`. These are useful in tests, and whenever several graphs with
different configurations coexist in the same page.

## Choosing the handler of an edge

The handler is not chosen by the edge, nor by the handler classes. It comes from the `handlerKind` metadata attached to
the `EdgeStyle` of the edge, when that style is registered in the `EdgeStyleRegistry`.

Three handler kinds are built in:

| `handlerKind` | Handler | Built-in `EdgeStyle`, with its registration key |
|---|---|---|
| `'default'` | `EdgeHandler` | `EntityRelation` (`entityRelationEdgeStyle`), and any edge without an `EdgeStyle` |
| `'elbow'` | `ElbowEdgeHandler` | `ElbowConnector` (`elbowEdgeStyle`), `Loop` (`loopEdgeStyle`), `SideToSide` (`sideToSideEdgeStyle`), `TopToBottom` (`topToBottomEdgeStyle`) |
| `'segment'` | `EdgeSegmentHandler` | `ManhattanConnector` (`manhattanEdgeStyle`), `OrthConnector` (`orthogonalEdgeStyle`), `SegmentConnector` (`segmentEdgeStyle`) |

An `EdgeStyle` registered without a `handlerKind`, or with a kind that has no matching handler, falls back to the
`'default'` one.

### Registering the built-in styles

Because the kind is carried by the registration, the table above only holds for styles registered with their dedicated
`register*EdgeStyle` helper, which declares the metadata for you. This is the way to register a built-in `EdgeStyle`,
whichever graph class is used. Registering it with a bare `EdgeStyleRegistry.add(key, edgeStyle)` leaves it without a
`handlerKind`, hence with the `'default'` handler.

`Graph` calls all these helpers when it is instantiated. `BaseGraph` registers nothing, so the application declares
what it uses:

```typescript
import { registerOrthogonalEdgeStyle } from '@maxgraph/core';

// registers OrthConnector under the 'orthogonalEdgeStyle' key, with the 'segment' handler kind
registerOrthogonalEdgeStyle();
```

See [Styles](./global-configuration.md#styles) for how the registries are filled by each graph class, and
[How to Use a Specific EdgeStyle](./edge-styles.md#how-to-use-a-specific-edgestyle) for the usage of the registration
key in a cell style.

### Declaring the matching handler factory

Registering the style is one half. The plugin must also know which handler to create for that kind, and
`SelectionCellsHandler` only provides the factory of the `'default'` kind, so that applications not using the other
two do not bundle them.

`Graph` declares the three built-in factories when it is instantiated, so it behaves exactly as the table describes.
With `BaseGraph`, the edges of the `'elbow'` and `'segment'` kinds are managed by `EdgeHandler` until the application
declares their factories, see
[Declaring the factories at construction](#declaring-the-factories-at-construction).

:::warning
When registering a **custom** `EdgeStyle`, make sure to declare the correct `handlerKind`. A wrong value produces a
handler that does not match the actual routing of the edge, for instance bend handles that cannot be moved
meaningfully. See [Custom EdgeStyle](./edge-styles.md#custom-edgestyle).
:::

## Configuring the handler factories

The handler classes instantiated by `SelectionCellsHandler` can be replaced per graph instance, which is how a custom
`VertexHandler` or `EdgeHandler` subclass is plugged in.

Both methods are set on the plugin instance:

```typescript
import { SelectionCellsHandler, VertexHandler } from '@maxgraph/core';

class MyVertexHandler extends VertexHandler {
  // for instance, override createCustomHandles() to add shape specific controls
}

// Assume that the SelectionCellsHandler plugin has been registered on the graph. Then get it and set the factory:
const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
selectionCellsHandler.setVertexHandlerFactory((state) => new MyVertexHandler(state));
```

For edges, the factory is registered per `handlerKind`, so a custom handler can be scoped to the edge styles it
actually fits:

```typescript
selectionCellsHandler.setEdgeHandlerFactory('elbow', (state) => new MyElbowEdgeHandler(state));
```

This also works for custom kinds. Register the `EdgeStyle` with your own kind, then declare the matching factory:

```typescript
EdgeStyleRegistry.add('myEdgeStyle', MyEdgeStyle, { handlerKind: 'my-kind' });
selectionCellsHandler.setEdgeHandlerFactory('my-kind', (state) => new MyEdgeHandler(state));
```

A factory replaces the previous one for that kind, and only affects handlers created afterwards. Set it before the
first selection occurs, typically right after creating the graph.

When the same implementation fits every edge, set it once for all kinds instead of repeating the call:

```typescript
selectionCellsHandler.setEdgeHandlerFactoryForAllKinds((state) => new MyEdgeHandler(state));
```

This also covers the kinds registered afterwards, since any kind without a dedicated factory falls back to the
`'default'` one.

:::warning
`setEdgeHandlerFactoryForAllKinds` discards all the factories previously set with `setEdgeHandlerFactory`, including
those declared for custom kinds. Call it first, then declare the per-kind factories that must differ.
:::

:::info[Changed in 0.25.0]
`setVertexHandlerFactory`, `setEdgeHandlerFactory` and `setEdgeHandlerFactoryForAllKinds` were introduced in version
`0.25.0`.

Previously, the handlers were configured by subclassing the graph and overriding factory methods on it. Those methods
no longer exist on `AbstractGraph`, `Graph` and `BaseGraph`. See the [Graph](./graph.md) page for the current
extension points of the graph classes, and the `CHANGELOG` for the detailed migration.
:::

### Declaring the factories at construction

_Since version `0.25.0`._

The setters above only affect the handlers created after the call. The `edgeHandlerFactories` graph option declares
them while the graph is built, so they already govern the first selection:

```typescript
import { BaseGraph, EdgeSegmentHandler, SelectionCellsHandler } from '@maxgraph/core';

const graph = new BaseGraph({
  plugins: [SelectionCellsHandler],
  edgeHandlerFactories: {
    segment: (state) => new EdgeSegmentHandler(state),
  },
});
```

Declare only the kinds the application uses, so that the handlers it does not need stay out of its bundle. To get them
all, use `getDefaultEdgeHandlerFactories()`, which is what `Graph` does:

```typescript
const graph = new BaseGraph({
  plugins: [SelectionCellsHandler],
  edgeHandlerFactories: getDefaultEdgeHandlerFactories(),
});
```

Overriding the handler of the `'default'` kind works the same way, and combines with the built-in ones through a
spread:

```typescript
const graph = new BaseGraph({
  plugins: [SelectionCellsHandler],
  edgeHandlerFactories: {
    ...getDefaultEdgeHandlerFactories(),
    default: (state) => new MyEdgeHandler(state),
  },
});
```

The option only declares the kinds it lists, the others keep what the plugin provides. It is ignored when the
`SelectionCellsHandler` plugin is not registered, as nothing creates cell handlers in that case.

## Examples and Demos

Configuration of the global handler objects, with vertex resize, edge bends, virtual bends and shift-click to add or
remove a bend:

- live demo: [CustomHandlesConfigurations](https://maxgraph.github.io/maxGraph/demo/?path=/story/styles-customhandlesconfigurations--default)
- source code: [CustomHandlesConfiguration.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/CustomHandlesConfiguration.stories.ts)

The story toggles the custom configuration with the `customHandleDefaults` control, so the effect of the
`HandleConfig`, `VertexHandlerConfig` and `EdgeHandlerConfig` properties can be compared with the defaults.

A custom `VertexHandler` providing shape specific handles:

- live demo: [Handles](https://maxgraph.github.io/maxGraph/demo/?path=/story/layouts-handles--default)
- source code: [Handles.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Handles.stories.ts)

A custom `EdgeHandler` bound to a custom `EdgeStyleHandlerKind`, which is the complete flow described in
[Configuring the handler factories](#configuring-the-handler-factories):

- live demo: [Wires](https://maxgraph.github.io/maxGraph/demo/?path=/story/connections-wires--default)
- source code: [Wires.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Wires.stories.ts)

The story declares a `WireEdgeHandler` extending `EdgeSegmentHandler`, registers its `EdgeStyle` under a dedicated
`'wire'` kind, then binds the two together:

```typescript
EdgeStyleRegistry.add('wireEdgeStyle', WireConnector, {
  isOrthogonal: true,
  handlerKind: 'wire',
});

selectionCellsHandler.setEdgeHandlerFactory('wire', (state) => new WireEdgeHandler(state));
```
