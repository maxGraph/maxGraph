---
sidebar_position: 1
description: Understanding the Graph class hierarchy — AbstractGraph, BaseGraph, and Graph — and how to choose the right one for your project.
---

# Graph

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::

:::tip
This page is a reference. For a step-by-step intro, see [Hello World](../tutorials/the-hello-world-example.md).
:::

## Introduction

The `Graph` class is the central component of maxGraph. It is the entry point for creating, displaying, and interacting with diagrams. It manages the rendering canvas, the data model, the stylesheet, and the user interactions (selection, editing, panning, etc.).

maxGraph offers a **class hierarchy** that lets you trade convenience for control:

```text
EventSource
    └── AbstractGraph  (abstract — core API, no defaults)
            ├── BaseGraph  (concrete — no built-ins registered)
            └── Graph      (concrete — all built-ins registered)
```

| Class | Role |
|---|---|
| `AbstractGraph` | Abstract base class shared by both concrete implementations |
| `Graph` | Batteries-included — auto-registers all defaults (shapes, styles, plugins) |
| `BaseGraph` | Production-optimized — registers nothing; you pick exactly what you need |

### Quick example

The shortest setup uses `Graph` and lets it load all defaults automatically:

```typescript
import '@maxgraph/core/css/common.css';
import { Graph, InternalEvent } from '@maxgraph/core';

const container = document.getElementById('graph-container')!;
InternalEvent.disableContextMenu(container);

const graph = new Graph(container);

graph.batchUpdate(() => {
  const v1 = graph.insertVertex({
    value: 'Hello',
    position: [20, 20],
    size: [80, 30],
  });
  const v2 = graph.insertVertex({
    value: 'World',
    position: [200, 150],
    size: [80, 30],
  });
  graph.insertEdge({
    source: v1,
    target: v2,
  });
});
```

## From mxGraph to maxGraph

maxGraph inherits its design from [mxGraph](https://github.com/jgraph/mxgraph), the library it succeeds. In mxGraph, the `mxGraph` class was a monolithic "God Object" of over 13,000 lines that bundled every feature — handlers, shapes, styles, and more — and loaded them unconditionally.

When maxGraph forked from mxGraph 4.2.2 in 2020, the `mxGraph` class was renamed to `Graph` (along with the `mx` prefix removal from all classes: `mxCell` became `Cell`, `mxGraphModel` became `GraphDataModel`, etc.). Over subsequent releases, the codebase was progressively modularized while preserving API compatibility:

- **Handlers** (cell editing, tooltips, panning, etc.) were extracted into **plugins** that can be loaded selectively.
- **Shapes, edge styles, perimeters, and edge markers** were moved from monolithic registries (`StyleRegistry`, `CellRenderer`) into dedicated per-type registries (`ShapeRegistry`, `EdgeStyleRegistry`, `PerimeterRegistry`, `EdgeMarkerRegistry`) that can be populated selectively.
- In version 0.18.0, the `Graph` class was split into `AbstractGraph`, `Graph`, and `BaseGraph` to enable tree-shaking at the class level.

If you are migrating from mxGraph, `Graph` is the closest equivalent to the original `mxGraph` class. See the [migration guide](./migrate-from-mxgraph.md) for details.

## AbstractGraph

**Source:** `packages/core/src/view/AbstractGraph.ts`

`AbstractGraph` is the abstract base class that holds all the core graph logic. It extends `EventSource` (the maxGraph event system) and provides the full graph API: cell management, editing, grouping, connections, validation, zooming, and more. Both `Graph` and `BaseGraph` inherit this same API — the choice between them does **not** affect the available methods, only which default configurations (shapes, styles, plugins) are loaded.

It is **not meant to be instantiated directly**. Use `Graph` or `BaseGraph` instead, or create your own subclass.

`AbstractGraph` defines two extension points for subclasses:

- **`registerDefaults()`** — called during construction, before any rendering. Subclasses override this to register shapes, edge styles, perimeters, and edge markers into the global registries. The default implementation is a no-op.
- **`initializeCollaborators()`** — called during construction to wire up the collaborator objects (`CellRenderer`, `GraphDataModel`, `GraphSelectionModel`, `Stylesheet`, `GraphView`). `Graph` builds them via factory methods that subclasses can override (`createCellRenderer()`, `createGraphDataModel()`, etc.); `BaseGraph` accepts them via the constructor `options` (dependency injection) and creates defaults only as fallback — this is the newer preferred pattern. The hook exists so the two subclasses can each pick the strategy that fits their usage.

At a high level, the `AbstractGraph` constructor goes through the following phases:

1. `registerDefaults()` — register style elements into the global registries
2. Container setup — use `options.container` or fall back to a fresh `<div>`
3. `initializeCollaborators()` — create or assign the collaborator objects
4. `view.init()` — initialize the DOM via the view
5. Plugin initialization — instantiate plugins from `options.plugins` and store them in an internal map, retrievable via `getPlugin()`
6. `view.revalidate()` — render the initial state

Plugin authors should keep in mind that plugins are constructed after `view.init()` but before the first `view.revalidate()`.

:::note[Future direction]
Some methods and behaviors currently embedded in `AbstractGraph` are planned to be extracted into dedicated plugins. This will improve separation of concerns, tree-shaking, and modularity. See [issue #762](https://github.com/maxGraph/maxGraph/issues/762) for details.
:::

## Graph

**Source:** `packages/core/src/view/Graph.ts`

`Graph` is the ready-to-use, **batteries-included** implementation. It is the direct descendant of the original `mxGraph` class and is designed for rapid prototyping and evaluation. It wires a container, a default model and view, registers all built-in shapes and markers, and loads the default plugin set — so you can create a working diagram with minimal setup.

When instantiated, `Graph` automatically:

1. **Registers all built-in style elements** via `registerDefaults()` — shapes, [edge styles](./edge-styles.md), [perimeters](./perimeters.md), and edge markers. See [Global Configuration — Styles](./global-configuration.md#styles) for the full list of registries.

2. **Loads all default [plugins](./plugins.md)** via `getDefaultPlugins()`.

3. **Exposes factory methods** (`createCellRenderer()`, `createGraphDataModel()`, etc.) that subclasses can override to customize collaborators.

### Adding plugins on top of the defaults

See the [Quick example](#quick-example) above for the minimal `new Graph(container)` setup that loads all defaults automatically. Passing any value to the `plugins` constructor argument **replaces** the default list — it does not extend it. To add a plugin while keeping the defaults, spread `getDefaultPlugins()` and append your own:

```typescript
import {
  getDefaultPlugins,
  Graph,
  RubberBandHandler,
} from '@maxgraph/core';

const graph = new Graph(container, undefined, [
  // getDefaultPlugins() is exposed so you can add to it without losing the defaults
  ...getDefaultPlugins(),
  RubberBandHandler, // add rubber band selection on top of the defaults
]);
```

## BaseGraph

**Source:** `packages/core/src/view/BaseGraph.ts`

`BaseGraph` is the minimal, **production-optimized** implementation, introduced in version 0.18.0. Unlike `Graph`, it **prevents loading any maxGraph defaults** — no built-in shapes, edge styles, perimeters, markers, or plugins are registered at construction time. You opt into the specific plugins and styles your application needs, and everything else is eliminated from the bundle by tree-shaking.

`BaseGraph` differs from `Graph` in the following ways:

1. **No `registerDefaults()` override** — the inherited no-op from `AbstractGraph` is used, so no built-in shapes, edge styles, perimeters, or markers are registered.
2. **No default plugins** — you must pass the exact list of plugins you need via the `options.plugins` constructor parameter.
3. **Collaborators via options** — instead of factory methods, `BaseGraph` accepts all five collaborators directly through the constructor options object (`cellRenderer`, `model`, `selectionModel`, `stylesheet`, `view`). `Graph` only lets you override `model` and `stylesheet` (via positional parameters); customizing `cellRenderer`, `selectionModel`, or `view` with `Graph` requires subclassing and overriding the corresponding factory method. `BaseGraph` is therefore more flexible for dependency injection, while `Graph` is more convenient for subclass-based customization.

### Registering style elements with BaseGraph

Since `BaseGraph` does not register any built-in style elements, you need to register them yourself. The following approaches are available.

:::info
Style registries (`ShapeRegistry`, `EdgeStyleRegistry`, `PerimeterRegistry`, `EdgeMarkerRegistry`) are **global** in both approaches — every `Graph` or `BaseGraph` instance in your application sees the same registrations. The choice between the two approaches is about where the registration code lives, not about scoping it to a specific instance.
:::

#### Approach 1: subclass BaseGraph

Subclass `BaseGraph` and override `registerDefaults()`. This keeps the registration code **co-located with the class that depends on it**, so the configuration travels with the class definition.

This is the approach used in the maxGraph example applications.

```typescript
import '@maxgraph/core/css/common.css';
import {
  BaseGraph,
  CellEditorHandler,
  EdgeMarker,
  EdgeMarkerRegistry,
  EdgeStyle,
  EdgeStyleRegistry,
  EllipseShape,
  FitPlugin,
  InternalEvent,
  PanningHandler,
  Perimeter,
  PerimeterRegistry,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
  ShapeRegistry,
} from '@maxgraph/core';

class CustomGraph extends BaseGraph {
  protected override registerDefaults() {
    // Register only the shapes you use
    // No need to register RectangleShape (default vertex fallback) or ConnectorShape (default edge fallback)
    ShapeRegistry.add('ellipse', EllipseShape);

    // Register only the perimeters you use
    PerimeterRegistry.add('ellipsePerimeter', Perimeter.EllipsePerimeter);
    PerimeterRegistry.add('rectanglePerimeter', Perimeter.RectanglePerimeter);

    // Register only the edge styles you use
    EdgeStyleRegistry.add('orthogonalEdgeStyle', EdgeStyle.OrthConnector, {
      handlerKind: 'segment',
      isOrthogonal: true,
    });

    // Register only the edge markers you use
    const arrowFunction = EdgeMarker.createArrow(2);
    EdgeMarkerRegistry.add('classic', arrowFunction);
    EdgeMarkerRegistry.add('block', arrowFunction);
  }
}

const container = document.getElementById('graph-container')!;
InternalEvent.disableContextMenu(container);

// Pass only the plugins you need
const graph = new CustomGraph({
  container,
  plugins: [
    CellEditorHandler,
    FitPlugin,
    PanningHandler,
    RubberBandHandler,
    SelectionCellsHandler,
    SelectionHandler,
  ],
});
```

#### Approach 2: register at application startup

Alternatively, you can register style elements directly at application startup, before creating any `BaseGraph` instance. This keeps the registration code **at the application entry point**, separate from any class definition — simpler when you don't need a custom subclass.

```typescript
import '@maxgraph/core/css/common.css';
import {
  BaseGraph,
  CellEditorHandler,
  EdgeMarker,
  EdgeMarkerRegistry,
  EdgeStyle,
  EdgeStyleRegistry,
  EllipseShape,
  FitPlugin,
  InternalEvent,
  PanningHandler,
  Perimeter,
  PerimeterRegistry,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
  ShapeRegistry,
} from '@maxgraph/core';

// Call this once at application startup
function registerStyleElements() {
  ShapeRegistry.add('ellipse', EllipseShape);
  PerimeterRegistry.add('ellipsePerimeter', Perimeter.EllipsePerimeter);
  PerimeterRegistry.add('rectanglePerimeter', Perimeter.RectanglePerimeter);
  EdgeStyleRegistry.add('orthogonalEdgeStyle', EdgeStyle.OrthConnector, {
    handlerKind: 'segment',
    isOrthogonal: true,
  });
  const arrowFunction = EdgeMarker.createArrow(2);
  EdgeMarkerRegistry.add('classic', arrowFunction);
  EdgeMarkerRegistry.add('block', arrowFunction);
}

registerStyleElements();

const container = document.getElementById('graph-container')!;
InternalEvent.disableContextMenu(container);

// Use BaseGraph directly — no subclass needed
const graph = new BaseGraph({
  container,
  plugins: [
    CellEditorHandler,
    FitPlugin,
    PanningHandler,
    RubberBandHandler,
    SelectionCellsHandler,
    SelectionHandler,
  ],
});
```

## Graph vs BaseGraph

### Constructor signatures

The two classes use different constructor patterns. Assuming `container`, `model`, `plugins`, `stylesheet`, and `cellRenderer` have been declared in scope:

```typescript
// Graph — positional parameters, defaults loaded automatically
const graph = new Graph(container, model, plugins, stylesheet);
```

```typescript
// BaseGraph — single options object, nothing loaded by default
const baseGraph = new BaseGraph({
  container,
  model,
  plugins: [/* your plugins */],
  stylesheet,
  // Additional options not available in Graph:
  cellRenderer,
  selectionModel: (graph) => new GraphSelectionModel(graph),
  view: (graph) => new GraphView(graph),
});
```

With `Graph`, you often need `undefined` placeholders to reach a later parameter (e.g., `new Graph(container, undefined, plugins)`). With `BaseGraph`, the options object lets you set only the properties you need.

### Comparison table

| Feature | `Graph` | `BaseGraph` |
|---|---|---|
| Built-in style elements (shapes, edge styles, perimeters, markers) | All auto-registered | None — register what you need |
| Plugins | All default plugins loaded | None — pass what you need |
| Collaborator customization | Via factory methods | Via constructor options |
| Constructor signature | Positional parameters | Single options object |
| Tree-shaking | Limited — all defaults are imported | Full — only imported code is bundled |
| Setup effort | Minimal | Requires explicit configuration |
| Familiarity for mxGraph users | Closest match — `Graph` is the renamed `mxGraph` class | New API — requires opting in to features mxGraph loaded by default |

### When to use Graph

- **Prototyping and evaluation** — get a working diagram with minimal setup
- **Tutorials and examples** — reduce boilerplate to focus on the feature being demonstrated
- **Applications where bundle size is not a concern** — internal tools, desktop apps, etc.

### When to use BaseGraph

- **Production web applications** — where bundle size impacts loading time and user experience
- **Applications using a limited set of features** — no need to ship code for shapes and plugins you never use
- **Embedding maxGraph in a larger application** — control exactly what is included in your bundle

## Examples and Demos

To see `Graph` and `BaseGraph` in action:

- **Storybook stories** — most stories use `Graph` for simplicity. See the [live demo](https://maxgraph.github.io/maxGraph/demo) or browse the [source](https://github.com/maxGraph/maxGraph/tree/main/packages/html/stories).
- **[ts-example](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example)** — a `Graph`-based application with custom shapes (Vite + TypeScript).
- **[ts-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-selected-features)** — a `BaseGraph`-based application that registers only the features it needs, demonstrating tree-shaking (Vite + TypeScript).
- **[ts-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-without-defaults)** — a minimal `BaseGraph` application with no default plugins or styles (Vite + TypeScript).

JavaScript equivalents are also available: [js-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-selected-features) and [js-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-without-defaults) (Webpack).

For the full list of examples and integration demos, see the [Demos and Examples](../demo-and-examples.md) page.

## Summary

- Use **`Graph`** for quick setup, prototyping, and learning — it mirrors the original mxGraph experience.
- Use **`BaseGraph`** for production — register only what you need and let the bundler eliminate the rest.
- Both classes share the **same API** via `AbstractGraph` — switching from `Graph` to `BaseGraph` is primarily a configuration change, not an API change.
