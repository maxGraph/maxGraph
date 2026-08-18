---
sidebar_position: 10
description: How-to use plugins and create new plugins.
---

# Plugins

:::warning
The plugin system is still under development and the API is subject to change.
:::

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::


## Introduction

The maxGraph plugins system aims to:
- reduce coupling in the code, in particular in the `Graph` class
- improve the [tree-shaking](./tree-shaking.md)
- provide extension points

Historically, the [Graph class](./graph.md) coming from `mxGraph` was a monolithic class that included all the features.
In particular, it contained many handler instances that were gradually phased out and turned into plugins.

For more details about discussions and decisions, refer to the following discussions:
- [initial proposal](https://github.com/maxGraph/maxGraph/discussions/51)
- [plugin usage](https://github.com/maxGraph/maxGraph/discussions/151#discussioncomment-4376164)


## Available Plugins

The following table lists all built-in plugins provided by maxGraph.

Plugins marked as **default** are automatically loaded when using [`Graph`](./graph.md). When using [`BaseGraph`](./graph.md#basegraph), no plugin is loaded — you must pass the ones you need explicitly.

| Plugin | Description | Default |
|---|---|---|
| `CellEditorHandler` | In-place cell label editing | ✔️  |
| `ConnectionHandler` | Drawing new edges between cells | ✔️  |
| `FitPlugin` | Fit-to-container utilities (`fit()`, `fitCenter()`) | ✔️  |
| `ImageBundlePlugin` | Image bundle resolution for `style.image` keys (see [Image Bundles](./image-bundles.md)) | ✔️  |
| `PanningHandler` | Mouse and touch panning | ✔️  |
| `PopupMenuHandler` | Right-click context menus | ✔️  |
| `RubberBandHandler` | Rubber band (lasso) selection. Requires [loading CSS](./css-and-images.md) | ❌ |
| `SelectionCellsHandler` | Manages per-cell selection handlers (move, resize, rotate). See [Cell Handlers](./cell-handlers.md) | ✔️  |
| `SelectionHandler` | Click and marquee selection | ✔️  |
| `TooltipHandler` | Hover tooltips | ✔️  |


## Retrieving and Using a Plugin

Use the `getPlugin` method to retrieve a plugin instance from a `Graph` instance and then call the methods or properties it provides:

```typescript
const graph = new Graph(container);
const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
panningHandler.useLeftButtonForPanning = true;
panningHandler.ignoreCell = true;
```

`getPlugin` returns `undefined` when no plugin is registered with the given id, so its return type is nullable.
Here, the non-null assertion (`!`) is intentional: `PanningHandler` is one of the [default plugins](#available-plugins) of `Graph`, so it is always available.
When the plugin may be absent, for example with `BaseGraph` or with a plugin list built at runtime, use optional chaining (`?.`) or an explicit check instead.


## Choosing the Plugins to Use

The plugins to use can be specified when creating a graph. \
The default plugins depend on which Graph class you use — see the [Graph documentation page](./graph.md) for details on choosing between `Graph` and `BaseGraph`.

Every plugin passed to the constructor is bundled with your application, so pass only the ones you need. See [Register Only What You Use](./tree-shaking.md#plugins) for the impact on the bundle size, in particular for read-only applications.

You can pass exactly the plugins you need via the constructor. Here is an example with `Graph`, where the `RubberBandHandler` plugin is added on top of the [default plugins](#available-plugins):

```typescript
const graph = new Graph(container, undefined, [
  ...getDefaultPlugins(),
  RubberBandHandler, // Enables rubber band selection
]);
```

Here is an example with `BaseGraph`:

```typescript
const graph = new BaseGraph({
  container,
  plugins: [
    CellEditorHandler,
    SelectionCellsHandler,
    SelectionHandler,
    PanningHandler,
  ],
});
```

It is also possible to use a dedicated set of plugins, in particular when [extending some plugins](#creating-a-custom-plugin) provided out of the box by `maxGraph`.

In the following example, a `MyCustomConnectionHandler` plugin is used instead of the default `ConnectionHandler` plugin:

```typescript
const graph = new BaseGraph({
  container,
  plugins: [
    CellEditorHandler,
    SelectionCellsHandler,
    MyCustomConnectionHandler,
    SelectionHandler,
  ],
});
```

:::warning
When replacing a built-in plugin with a custom implementation, make sure you do **not** include both the original and the custom plugin in the list. Loading two plugins that handle the same functionality (e.g., both registering listeners for the same events) leads to non-deterministic behavior.
:::

## Creating a Custom Plugin

A custom plugin is defined as a class:
- It must implement the `GraphPlugin` interface, whose only member, `onDestroy`, is mandatory. It is called when the graph is destroyed.
- Its constructor must satisfy the `GraphPluginConstructor` type.
- It can provide new methods to extend the existing API or introduce new behavior (using listeners, for example).


```typescript
class MyCustomPlugin implements GraphPlugin {
  static pluginId = 'my-custom-plugin';

  constructor(graph: Graph) {
    // Initialization and configuration code
  }

  /** Releases the resources acquired by the plugin. */
  onDestroy(): void {
    // Unregister the event listeners, clear the timers, drop the references to the graph
    // and to its cells, and empty the caches, to help garbage collection.
    // Plugins holding none of these can leave the method empty, as `FitPlugin` does.
  }
}
```
