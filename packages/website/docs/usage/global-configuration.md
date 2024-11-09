---
sidebar_position: 1
description: How-to configure maxGraph globally.
---

# Global Configuration

This guide explains how to configure `maxGraph` globally. This global configuration applies to all instances of `Graph`.


## General

The following objects can be used to configure `maxGraph` globally:

  - `Client`: this is the historical entry point for global configuration, coming from the `mxGraph` library.
  - `GlobalConfig` (since 0.11.0): for shared resources (logger).
  - `HandleConfig` (since 0.14.0): for shared handle configurations.
  - `StencilShapeConfig` (since 0.11.0): for stencil shapes.
  - `VertexHandlerConfig` (since 0.12.0): for `VertexHandler`.

Some functions are provided to reset the global configuration to the default values. For example:

  - `resetHandleConfig` (since 0.14.0)
  - `resetVertexHandlerConfig` (since 0.14.0)

:::note
Notice that the new global configuration elements introduced as version _0.11.0_ are experimental and are subject to change in future versions.
:::

:::info
For former mxGraph users, the global configuration objects allow to set the default values previously defined in `mxConstants` and used everywhere in the code.
Not all values are currently configurable yet, but the list is growing. 

See also discussions in [issue #192](https://github.com/maxGraph/maxGraph/issues/192).
:::

## Styles

`maxGraph` provides several global registries used to register style configurations.

  - `CellRenderer`: shapes
  - `MarkerShape`: edge markers (also known as `startArrow` and `endArrow` in `CellStateStyle`)
  - `StyleRegistry`: edge styles and perimeters
  - `StencilShapeRegistry`: stencil shapes

When instantiating a `Graph` object, the registries are filled with `maxGraph` default style configurations. There is no default stencil shapes registered by default.


## Serialization

`CodecRegistry` is used for serialization and deserialization of objects in XML object.
By default, no codec is registered. Some functions are provided to register codecs for specific objects.
