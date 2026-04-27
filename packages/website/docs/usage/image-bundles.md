---
sidebar_position: 10
description: Map short keys used in cell styles to images via the ImageBundlePlugin.
---

# Image Bundles

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::

:::info
`ImageBundlePlugin` is a new plugin introduced in version 0.24.0. It replaces the methods previously defined directly on the `AbstractGraph` class (`addImageBundle`, `removeImageBundle`, `getImageFromBundles`, `imageBundles`). See the [CHANGELOG](https://github.com/maxGraph/maxGraph/blob/main/CHANGELOG.md) for migration details.
:::


## What is an Image Bundle?

An `ImageBundle` maps short string keys to image sources. A "source" is either a URL (relative or absolute) or a data URI (e.g. `data:image/svg+xml,...`).

Once a bundle is registered with the `ImageBundlePlugin`, its keys can be used in the `image` property of any cell style:

```typescript
const style: CellStateStyle = { image: 'myKey' };
```

When the graph renders the cell, the key is replaced with the underlying URL or data URI from the bundle. This is useful for:

- **Keeping cell styles compact** — reference `'server'` instead of a long data URI in every style.
- **Swapping assets centrally** — change the bundle, all cells that reference its keys update.
- **Embedding SVGs inline** — avoid an extra HTTP request per icon.


## Registering the Plugin

### With `Graph` (default)

`ImageBundlePlugin` ships in `getDefaultPlugins()` and is loaded automatically when a [`Graph`](./graph.md) is created:

```typescript
import { Graph } from '@maxgraph/core';

const graph = new Graph(container); // ImageBundlePlugin already registered
```

### With `BaseGraph` (opt-in)

[`BaseGraph`](./graph.md#basegraph) does not register any plugins by default. To use image bundles, add `ImageBundlePlugin` to the `plugins` option:

```typescript
import { BaseGraph, ImageBundlePlugin } from '@maxgraph/core';

const graph = new BaseGraph({
  container,
  plugins: [ImageBundlePlugin],
});
```

For more details about the plugin system, see the [Plugins](plugins.md) documentation.


## Adding a Bundle

Create an `ImageBundle`, register keys with `putImage`, then add the bundle to the plugin:

```typescript
import { Graph, ImageBundle, ImageBundlePlugin } from '@maxgraph/core';

const graph = new Graph(container);

const bundle = new ImageBundle();
bundle.putImage('server', 'images/icons48/server.png');
bundle.putImage('keys', 'images/icons48/keys.png');
bundle.putImage(
  'gradient',
  'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
        '<rect fill="#4a90e2" width="100%" height="100%"/></svg>'
    )
);

graph.getPlugin<ImageBundlePlugin>('image-bundle')!.addImageBundle(bundle);
```

:::tip
The non-null assertion (`!`) on `getPlugin` is intentional for `addImageBundle`: if the plugin is not registered, the call should fail fast rather than silently drop the bundle.
:::


## Referencing Keys from Cell Styles

Once the bundle is registered, set the key as `style.image`:

```typescript
graph.batchUpdate(() => {
  graph.insertVertex({
    parent: graph.getDefaultParent(),
    value: 'Server',
    position: [20, 20],
    size: [80, 80],
    style: { shape: 'image', image: 'server' },
  });
});
```

`maxGraph` resolves `'server'` to `'images/icons48/server.png'` when the cell is rendered. No change to the style API is required — the same `image` property accepts both direct paths/data URIs and bundle keys.


## Resolution Rules

Key resolution is performed by `AbstractGraph.postProcessCellStyle` and follows these rules:

1. **If no plugin is registered**, the raw value of `style.image` is used as-is (useful when `style.image` is already a URL or data URI).
2. **Bundles are consulted in insertion order**. The first bundle that knows the key wins; later bundles are ignored for that key.
3. **If no bundle matches the key**, the raw value of `style.image` is used as-is. This means a mistyped key is silently used as a path, which may produce a broken image at runtime.
4. **Short data URI form**: values of the form `data:image/<format>,<payload>` (without `;base64`) are converted into a well-formed data URI by the renderer.

:::tip
Register the most specific bundle first if you want it to override values from a fallback bundle.
:::


## Managing Bundles at Runtime

The plugin exposes the full bundle collection. Use it to inspect, reorder, or remove bundles:

```typescript
const plugin = graph.getPlugin<ImageBundlePlugin>('image-bundle')!;

// Remove a bundle
plugin.removeImageBundle(bundle);

// Resolve a key manually (returns null if no bundle matches)
const url = plugin.getImageFromBundles('server');

// Inspect the registered bundles
console.log(plugin.imageBundles.length);
```

For read-only access in code that may run without the plugin (for example a shared helper used by both `Graph` and `BaseGraph`), use optional chaining:

```typescript
const url = graph.getPlugin<ImageBundlePlugin>('image-bundle')?.getImageFromBundles('server');
// url is null when the key is unknown, undefined when the plugin is absent
```


## Live Demo

A Storybook demo illustrates a `BaseGraph` with `ImageBundlePlugin`, several cells referencing inline SVG keys, and one cell referencing a PNG served at a URL:

- **Live demo**: [ImageBundle](https://maxgraph.github.io/maxGraph/demo/?path=/story/icon_images-imagebundle--default)
- **Source code**: [ImageBundle.stories.ts](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/ImageBundle.stories.ts)
