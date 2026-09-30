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

Plugins marked as **default** are automatically loaded when using [`Graph`](./graph.md). When using [`BaseGraph`](./graph.md#basegraph), no plugin is loaded, you must pass the ones you need explicitly.

| Plugin | Id, for `getPlugin` | Description | Kind | Default |
|---|---|---|---|---|
| `CellEditorHandler` | `'CellEditorHandler'` | In-place cell label editing. Requires [loading CSS](./css-and-images.md#css) | Behavior | ✔️  |
| `ConnectionHandler` | `'ConnectionHandler'` | Drawing new edges between cells | Behavior, opt-in | ✔️  |
| `FitPlugin` | `'fit'` | Fit-to-container utilities (`fit()`, `fitCenter()`) | API | ✔️  |
| `ImageBundlePlugin` | `'image-bundle'` | Image bundle resolution for `style.image` keys (see [Image Bundles](./image-bundles.md)) | API | ✔️  |
| `PanningHandler` | `'PanningHandler'` | Mouse and touch panning | Behavior, opt-in | ✔️  |
| `PopupMenuHandler` | `'PopupMenuHandler'` | Right-click context menus. Requires [loading CSS](./css-and-images.md#css) | API | ✔️  |
| `RubberBandHandler` | `'RubberBandHandler'` | Rubber band (lasso) selection. Requires [loading CSS](./css-and-images.md#css) | Behavior | ❌ |
| `SelectionCellsHandler` | `'SelectionCellsHandler'` | Manages per-cell selection handlers: the selection border, and the handles that resize a vertex, bend an edge or reconnect it. See [Cell Handlers](./cell-handlers.md) | Behavior | ✔️  |
| `SelectionHandler` | `'SelectionHandler'` | Moving and cloning the selection with the mouse, and selecting on mouse down. A plain click selects without it, that behavior belonging to the graph | Behavior | ✔️  |
| `TooltipHandler` | `'TooltipHandler'` | Hover tooltips. Requires [loading CSS](./css-and-images.md#css) | Behavior, opt-in | ✔️  |

### What the Kind column means

The **Kind** column answers one question: what does the plugin do if the application never calls it?

| Kind | With no call at all | What calling it buys you |
|---|---|---|
| Behavior | The feature works as soon as the plugin is in the list | Nothing beyond setting the configuration flags |
| Behavior, opt-in | Nothing, the feature stays inert until the application switches it on with a call made on the graph, see [The plugins you must switch on](#the-plugins-you-must-switch-on). `PanningHandler` keeps a residual reaction to pinch and multi touch gestures | The feature itself |
| API | The feature does not exist, the call is what provides it. The plugin may still react to input, see `PopupMenuHandler` below | Everything: the call is the feature |

With `FitPlugin`, the call is the only thing that ever happens, so without it the feature does not exist. With
`SelectionCellsHandler`, every selected cell gets its border drawn whether the application calls anything or not. Its
handles are a separate matter: the ones that resize a vertex need `SelectionHandler` as well, and the rotation handle
needs `VertexHandlerConfig.rotationEnabled`, which is `false` by default.

Most of these plugins also expose extension points, a factory to replace or a method to override: the
`ConstraintHandler` factory of `ConnectionHandler`, the cell handler factories of `SelectionCellsHandler`, the
`getTooltipForCell` of `TooltipHandler`. The column does not track them, because they change a behavior that runs
anyway rather than decide whether it runs at all, and the page of each feature documents them.

### The plugins you must switch on

Three plugins of the table are marked **opt-in**, because loading them is not enough: they register their listeners
like any other behavior plugin, but the feature they exist for stays inert until the application switches it on.

| Plugin | What turns it on |
|---|---|
| `ConnectionHandler` | `graph.setConnectable(true)` |
| `PanningHandler` | `graph.setPanning(true)` |
| `TooltipHandler` | `graph.setTooltips(true)` |

`PopupMenuHandler` needs a call too, and that is why it is an `API` plugin rather than an opt-in one: the
`factoryMethod` the application sets on it supplies the menu instead of adjusting one that would have appeared anyway.
Without it no menu is shown at all, not an empty one, since the popup is skipped entirely.

Loading one of these four and forgetting the call is the usual reason for concluding that a feature does not work. The
reverse is just as true, and it matters when trimming the plugin list of a `BaseGraph`: such a call is useless, and
silently does nothing, if the matching plugin is not in the list.

Two of the four are not entirely idle, so do not read them as "nothing happens at all". `PanningHandler` reacts to two
inputs that never test `panningEnabled`. A pinch gesture zooms, through the `pinchEnabled` field left at `true` and the
gesture events that only some touch browsers emit. And a drag pans whenever `isForcePanningEvent` returns true, which
it does for a multi touch event and whenever `ignoreCell` has been set, so that flag alone makes the graph pannable.

`PopupMenuHandler`, although it shows no menu, is enabled from the start: on a right-click it changes the selection,
clears it when the click lands on the background, hides the tooltip and consumes the event.

A `Behavior` plugin can still be retrieved with `getPlugin`, to set its configuration flags, as the `PanningHandler`
example of the [next section](#retrieving-and-using-a-plugin) does. That is not what makes a plugin an `API` one: the
distinction is whether anything happens when the application never calls the plugin at all.


## Retrieving and Using a Plugin

Use the `getPlugin` method to retrieve a plugin instance from a `Graph` instance and then call the methods or properties it provides:

```typescript
const graph = new Graph(container);
graph.setPanning(true); // panningEnabled is false by default

const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
panningHandler.useLeftButtonForPanning = true; // otherwise panning needs the right button or ctrl+shift
panningHandler.ignoreCell = true; // pan even when the drag starts on a cell
```

`setPanning(true)` is what an ordinary drag tests, and the two paths that bypass it are described under
[The plugins you must switch on](#the-plugins-you-must-switch-on).

`getPlugin` returns `undefined` when no plugin is registered with the given id, so its return type is nullable.
Here, the non-null assertion (`!`) is intentional: `PanningHandler` is one of the [default plugins](#available-plugins) of `Graph`, so it is always available.
When the plugin may be absent, for example with `BaseGraph` or with a plugin list built at runtime, use optional chaining (`?.`) or an explicit check instead.


## Choosing the Plugins to Use

The plugins to use can be specified when creating a graph. \
The default plugins depend on which Graph class you use, see the [Graph documentation page](./graph.md) for details on choosing between `Graph` and `BaseGraph`.

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

It is also possible to use a dedicated set of plugins, in particular when [subclassing a built-in plugin](../guides/extend-maxgraph.md#a-plugin).

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
When replacing a built-in plugin with a custom implementation, do **not** pass both the original and your subclass: they share a `pluginId`, so one of the two silently becomes unreachable through `getPlugin` and never receives its `onDestroy()`. [A plugin](../guides/extend-maxgraph.md#a-plugin) explains why.
:::

## Creating a Custom Plugin

### When a plugin is the right tool

A plugin is the unit of extension of a **graph instance**. Prefer one when the behavior you add has at least one of
these traits:

- **It owns resources that must be released.** `destroy()` calls `onDestroy` on every registered plugin first, before
  destroying the view and before clearing the listeners of the graph, so a plugin can still reach the graph and its
  container while cleaning up. This is what makes a plugin safe to write: `PanningHandler` registers a listener on
  `document` itself, which nothing outside the plugin would remove, and drops it in its `onDestroy` along with its graph
  listeners. Without that hook, every such resource has to be tracked by the application.
- **It must be reachable from anywhere that holds the graph.** `graph.getPlugin<MyPlugin>('my-plugin')` returns the
  instance, so no module has to store it and no function has to receive it as an argument. A feature written as a plain
  helper class forces the application to answer "where do I keep this object, and how does that screen get it".
- **It is configured per graph.** Each graph constructs its own plugins, so two graphs on the same page can behave
  differently. Values shared by every graph belong in the [global configuration](./global-configuration.md) objects
  instead.
- **It is optional.** A plugin that is never passed to a graph is never referenced, so it is never bundled, which is
  the mechanism behind [tree-shaking](./tree-shaking.md).

### When it is not

- **The extension point is global, not per graph.** Shapes, edge styles, perimeters, edge markers and stencils live in
  registries shared by every graph of the page, listed in [Global Configuration](./global-configuration.md#styles), and
  the codecs in a registry of their own, see
  [Codecs and Serialization](./global-configuration.md#codecs-and-serialization). Registering any of them from a plugin
  constructor would tie a global side effect to the lifetime of one graph.
- **The feature must be added or removed while the application runs.** The plugin list is fixed when the graph is
  constructed: there is no `addPlugin` and no `removePlugin`. Register the plugin once and let it do nothing while it
  is disabled, or create another graph.
- **You need a hook maxGraph does not offer.** A plugin gets exactly two: its constructor, and `onDestroy`. Everything
  else is wired by the plugin itself, with `graph.addListener`, `graph.addMouseListener` or plain DOM listeners, and
  must be unwired symmetrically in `onDestroy`.

### Writing the plugin

A custom plugin is defined as a class:
- It must implement the `GraphPlugin` interface, whose only member, `onDestroy`, is mandatory. It is called when the graph is destroyed.
- It must satisfy the `GraphPluginConstructor` type, which asks for the static `pluginId` below and for a constructor whose first parameter is the graph, typed `AbstractGraph` rather than `Graph` so that a `BaseGraph` is accepted too. Further parameters are allowed as long as they have a default value, since the graph is the only argument ever passed.
- Its `pluginId` is the key passed to `getPlugin`, not the name of the class. New plugins use a kebab-case id, lowercase for a single word, without a `Plugin` or `Handler` suffix: `'image-bundle'` and `'fit'` follow that rule, while the class-named ids of the historical handlers are kept for backwards compatibility only.
- It can provide new methods to extend the existing API or introduce new behavior (using listeners, for example).


```typescript
class MyCustomPlugin implements GraphPlugin {
  static readonly pluginId = 'my-custom-plugin';

  constructor(graph: AbstractGraph) {
    // Initialization and configuration code, and the listeners the plugin needs
  }

  /** Releases the resources acquired by the plugin. */
  onDestroy(): void {
    // Unregister the event listeners, clear the timers, drop the references to the graph
    // and to its cells, and empty the caches, to help garbage collection.
    // Plugins holding none of these can leave the method empty, as `FitPlugin` does.
  }
}
```
