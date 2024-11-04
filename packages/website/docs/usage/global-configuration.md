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
  - `StencilShapeConfig` (since 0.11.0): for stencil shapes.
  - `VertexHandlerConfig` (since 0.12.0): for `VertexHandler`.

Notice that the new global configuration elements introduced as version _0.11.0_ are experimental and are subject to change in future versions.

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
