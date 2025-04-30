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
- improve the tree-shaking
- provide extension points

Historically, the `Graph` class coming from `mxGraph` was a monolithic class that included all the features.
In particular, it contained a large number of handler instances that were gradually phased out and turned into plugins.

For more details about discussions and decisions, refer to the following discussions:
- https://github.com/maxGraph/maxGraph/discussions/51
- https://github.com/maxGraph/maxGraph/discussions/151#discussioncomment-4376164


## Retrieving and Using a Plugin

Use the `getPlugin` method to retrieve a plugin instance from a `Graph` instance and then call the methods or properties it provides:

```typescript
const graph = new Graph(container);
const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler');
panningHandler.useLeftButtonForPanning = true;
panningHandler.ignoreCell = true;
```


## Choosing the Plugins to Use

The plugins to use can be specified when creating a `Graph`.

If no plugins are specified at the `Graph` instance construction, the default set of plugins available in `maxGraph` is used.

To use a new plugin in addition to the default set of plugins, simply add the plugin to the list of plugins passed to the `Graph` constructor.
In the following example, the `RubberBandHandler` plugin is added to the default set of plugins:

```javascript
const graph = new Graph(container, undefined, [
  ...getDefaultPlugins(),
  RubberBandHandler, // Enables rubber band selection
]);
```

It is also possible to use a dedicated set of plugins, in particular when [extending some plugins](#creating-a-custom-plugin) provided out of the box by `maxGraph`.

In the following example:
- a `MyCustomConnectionHandler` plugin is used instead of the default `ConnectionHandler` plugin
- only a subset of the default plugins is used

```javascript
const graph = new Graph(container, undefined, [
  CellEditorHandler,
  SelectionCellsHandler,
  MyCustomConnectionHandler,
  SelectionHandler,
]);
```

## Creating a Custom Plugin

A custom plugin is defined as a class:
- It must implement the `GraphPlugin` interface.
- Its constructor must satisfy the `GraphPluginConstructor` type.
- It can provide new methods to extend existing API or introduce new behavior (using listeners for example).


```typescript
class MyCustomPlugin implements GraphPlugin {
  static pluginId = 'my-custom-plugin';

  constructor(graph: Graph) {
    // Initialization and configuration code
  }
}
```
