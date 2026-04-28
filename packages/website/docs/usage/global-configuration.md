---
sidebar_position: 5
description: How-to configure maxGraph globally.
---

# Global Configuration

This guide explains how to configure `maxGraph` globally. This global configuration applies to all instances of [`Graph`](./graph.md).


## General

The following objects can be used to configure `maxGraph` globally:

  - `Client`: this is the historical entry point for global configuration, coming from the `mxGraph` library.
  - `EdgeHandlerConfig` (since 0.14.0): for `EdgeHandler` (including subclasses).
  - `GlobalConfig` (since 0.11.0): for shared resources (logger).
  - `HandleConfig` (since 0.14.0): for shared handle configurations.
  - `StencilShapeConfig` (since 0.11.0): for stencil shapes.
  - `StyleDefaultsConfig` (since 0.14.0): for the default values of the Cell styles.
  - `TranslationsConfig` (since 0.16.0): for the configuration of `Translations`.
  - `VertexHandlerConfig` (since 0.12.0): for `VertexHandler`.
  - For Connectors/EdgeStyles:
    - `EntityRelationConnectorConfig` (since 0.15.0): for `EntityRelation`.
    - `ManhattanConnectorConfig` (since 0.16.0): for `ManhattanConnector`.
    - `OrthogonalConnectorConfig` (since 0.16.0): for `OrthConnector`.

Some functions are provided to reset the global configuration to the default values. For example:

  - `resetEdgeHandlerConfig` (since 0.14.0)
  - `resetGlobalConfig` (since 0.23.0)
  - `resetHandleConfig` (since 0.14.0)
  - `resetStencilShapeConfig` (since 0.23.0)
  - `resetStyleDefaultsConfig` (since 0.14.0)
  - `resetTranslationsConfig` (since 0.16.0)
  - `resetVertexHandlerConfig` (since 0.14.0)
  - For Connectors/EdgeStyles:
    - `resetEntityRelationConnectorConfig` (since 0.15.0)
    - `resetManhattanConnectorConfig` (since 0.16.0)
    - `resetOrthogonalConnectorConfig` (since 0.16.0)

:::note
Notice that the new global configuration elements introduced as version _0.11.0_ are experimental and are subject to change in future versions.
:::

:::info
For former mxGraph users, the global configuration objects allow you to set the default values previously defined in `mxConstants` and used everywhere in the code.
Not all values are currently configurable yet, but the list is growing. 

See also discussions in [issue #192](https://github.com/maxGraph/maxGraph/issues/192).
:::

## Styles

`maxGraph` provides several global registries used to register style configurations.

- `EdgeMarkerRegistry`: edge markers (since 0.20.0, previously managed by `MarkerShape`)
- `EdgeStyleRegistry`: edge styles (since 0.20.0, previously managed by `StyleRegistry`)
- `PerimeterRegistry`: perimeters (since 0.20.0, previously managed by `StyleRegistry`)
- `ShapeRegistry`: shapes (since 0.20.0, previously managed by `CellRenderer`)
- `StencilShapeRegistry`: stencil shapes

The behavior depends on which Graph class you use (see the [Graph documentation page](./graph.md) for more details):

- **`Graph`**: when instantiated, the registries are automatically filled with all `maxGraph` default style configurations.
- **`BaseGraph`**: the registries are **not** filled automatically. You must register only the style elements your application needs, typically by overriding `registerDefaults()` in a subclass. This enables tree-shaking — unused shapes, edge styles, perimeters, and markers are not included in your bundle.

There are no default stencil shapes registered by default with either class.

If a style references a shape that is not registered, the fallback shape is used:
- **Vertices**: `RectangleShape` by default (configurable via `CellRenderer.defaultVertexShape`). No need to register it.
- **Edges**: `ConnectorShape` by default (configurable via `CellRenderer.defaultEdgeShape`). No need to register it.

Missing edge styles, perimeters, or markers produce no rendering for the corresponding feature.

To manually register all default style configurations (useful with `BaseGraph` if you want all defaults without subclassing), you can use the following functions:

```javascript
registerDefaultEdgeMarkers();
registerDefaultEdgeStyles();
registerDefaultPerimeters();
registerDefaultShapes();
```

It is possible to unregister all elements from a style registry using the related `unregister` function. For example:

```javascript
unregisterAllEdgeMarkers();
unregisterAllEdgeStyles(); // since 0.20.0
unregisterAllEdgeStylesAndPerimeters();
unregisterAllPerimeters(); // since 0.20.0
unregisterAllShapes();
unregisterAllStencilShapes();
```


## Codecs and Serialization

`CodecRegistry` is used for serialization and deserialization of objects in XML objects.
By default, no codec is registered. Some functions are provided to register codecs for specific objects.

For more details about the codecs, see the Codec [documentation page](./codecs.md).
