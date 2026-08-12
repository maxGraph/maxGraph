---
sidebar_position: 10
description: Reduce the contribution of maxGraph to your application bundle by registering only the features you actually use.
---

# Tree-Shaking

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::

## Introduction

`maxGraph` is a fork of [mxGraph](https://github.com/jgraph/mxgraph), which did not support tree-shaking efficiently.
Regardless of which parts of `mxGraph` were used, its contribution to the application size was around 820 KB (minified).
Since its inception, one of `maxGraph`'s goals has been to provide better tree-shaking support.

This page explains what tree-shaking is, what `maxGraph` does to support it, and above all what **your application** must
do to benefit from it. The short version: use [`BaseGraph`](./graph.md#basegraph) and register only the features you
actually use.

Tree-shaking is an ongoing effort tracked in
[issue #665](https://github.com/maxGraph/maxGraph/issues/665). See [Going further](#going-further) for the current
limitations.


## What is Tree-Shaking?

**Tree-shaking is a form of dead code elimination performed at bundling time.** Bundle size reduction, dead code
elimination, code shrinking and optimization all refer to the same goal: removing from the final bundle the code that
the application never runs. The bundler analyzes the dependency graph of the application, starting from its entry
points, and keeps only the code that is actually reachable.

The name comes from the tree analogy: the dependency graph is a tree, and shaking it makes the dead branches fall,
leaving only the parts of the codebase the application needs.

It differs from traditional dead code elimination on one important point: **dead code elimination works within a single
module, tree-shaking works across the whole bundle**. Rather than analyzing files in isolation, it traces dependencies
from the entry points through the complete dependency graph. It is sometimes described as *live code inclusion* rather
than dead code removal.

### Why ES modules matter

Tree-shaking relies on the **static structure** of the ES module syntax. Because `import` and `export` declarations can
be analyzed without executing the code, and because imports can be done at the granularity of a single named export, the
bundler can determine at build time which exports are used and which can be dropped. This is not possible with CommonJS,
whose `require` calls are ordinary function calls resolved at runtime.

### Why side effects matter

A module has a *side effect* when importing it does something beyond exposing its exports, for instance mutating a
global, or injecting a stylesheet. A bundler cannot drop a module with side effects, even when none of its exports are
used, because the specification requires the side effect to be evaluated.

Library authors declare this with the `sideEffects` field of `package.json`. Marking a package as side-effect free lets
bundlers skip whole modules and their subtrees, which is far more effective than the export-level analysis alone.
Individual expressions can also be annotated with `/*#__PURE__*/` or `/*#__NO_SIDE_EFFECTS__*/` so that the bundler knows
a call can be removed when its result is unused.

### Further reading

- [Tree shaking](https://en.wikipedia.org/wiki/Tree_shaking) on Wikipedia, for the definition and the history of the technique
- [Tree shaking](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking) in the MDN glossary
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/) in the Webpack guides, which details the `sideEffects` flag and the `usedExports` optimization
- [Tree-shaking](https://tsdown.dev/options/tree-shaking) in the tsdown documentation
- [Dead Code Elimination](https://rolldown.rs/in-depth/dead-code-elimination) in the Rolldown documentation, which details pure annotations and module-level analysis


## Not All Bundlers Behave the Same

Bundlers and build tools do not all implement tree-shaking the same way, and some are more effective than others:

- **Webpack** and **Rspack** work at three levels: module, export and code (minification). They favor correctness and rely on static analysis.
- **esbuild** splits modules into top-level statements and analyzes each independently.
- **Rollup** and **Rolldown** perform the finest-grained analysis, at the AST node level, with context-aware side-effect detection. They generally produce the smallest output for libraries.
- **tsdown** enables tree-shaking by default.

The consequence is practical: **the result depends on your own toolchain**, so the same application code can produce
noticeably different bundle sizes depending on the bundler and its configuration. Understand how tree-shaking works in
your specific environment, and measure there rather than relying on figures obtained elsewhere.

For a detailed comparison of the strategies used by the various bundlers, see the
[Tree Shaking discussion](https://github.com/orgs/web-infra-dev/discussions/29) in the web-infra-dev organization.


## What maxGraph Provides

`maxGraph` is packaged so that bundlers can do their job:

- The package ships an **ESM build** (`lib/esm`) alongside a CommonJS one, selected through the `exports` conditions of `package.json`. Bundlers pick the ESM build automatically. **Do not force the CommonJS build**, it cannot be tree-shaken.
- The package is declared **free of side effects** except for its CSS files (`"sideEffects": ["**/*.css"]`), so bundlers may drop entire unused modules.
- Built-in elements are **registered explicitly rather than implicitly**, through registration functions the application calls, which is the mechanism the rest of this page describes.

This is a long-running effort. The main milestones so far:

| Version | Improvement |
|---|---|
| 0.6.0 | Codecs are no longer registered by default |
| 0.11.0 | `MaxLog` and `MaxWindow` are no longer called from within `maxGraph`, avoiding their transitive inclusion |
| 0.12.0 | The npm package is declared without side effects |
| 0.14.0 | Graph mixins start being converted into optional plugins |
| 0.18.0 | `BaseGraph` is introduced, along with the `registerDefault*` functions |
| 0.20.0 | Dedicated registries replace the monolithic `StyleRegistry` and `CellRenderer` registration |
| 0.24.0 | A dedicated registration helper per built-in `EdgeStyle`, and the image bundle feature moves to a plugin |
| 0.25.0 | The cell handlers move from `AbstractGraph` to the `SelectionCellsHandler` plugin, so an application that does not register that plugin no longer bundles `VertexHandler`, `EdgeHandler`, `ElbowEdgeHandler` and `EdgeSegmentHandler` |

The impact of these changes is measured on the example applications and communicated in the release notes. See for
instance the [0.18.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.18.0) and
[0.24.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.24.0) releases, which both report the bundle size of each
example before and after the changes. New features are assessed the same way.

:::note
The approach is not specific to `maxGraph`. Other libraries facing the same problem expose a comparable opt-in
mechanism, for example [Apache ECharts](https://echarts.apache.org/handbook/en/basics/import/#shrinking-bundle-size),
where charts, components and renderers are imported and passed to a `use()` function instead of being loaded by default.
:::


## The Starting Point: Use BaseGraph

`maxGraph` provides two concrete graph classes, and the choice between them is the single most important decision for
your bundle size. See the [Graph](./graph.md) page for the full comparison.

- **`Graph`** is the ready-to-use class. It wires a container, a default model and view, registers all built-in shapes, edge styles, perimeters and markers, and loads the default plugin set. It is the historical implementation, the direct descendant of the original `mxGraph` class, and it is meant for prototyping and evaluation. Because it needs no configuration, it is also what most of this documentation, most [example applications](../demo-and-examples.md) and most Storybook stories use, so that each of them focuses on the feature it illustrates rather than on registration boilerplate. **Do not read that ubiquity as a recommendation for production.**
- **`BaseGraph`** exposes the minimal, tree-shakeable graph skeleton for production builds, where you opt into specific plugins and style elements yourself.

Instantiating `Graph` pulls the following into your bundle, whether the application uses them or not:

| Loaded by `Graph` | Content |
|---|---|
| `registerDefaultShapes()` | 16 built-in shapes |
| `registerDefaultEdgeStyles()` | 8 built-in edge styles |
| `registerDefaultPerimeters()` | 5 built-in perimeters |
| `registerDefaultEdgeMarkers()` | 9 built-in edge markers |
| `getDefaultPlugins()` | 9 plugins, and transitively the cell handlers they instantiate |

`BaseGraph` registers **none** of them. Nothing is loaded that you did not ask for:

```typescript
import { BaseGraph } from '@maxgraph/core';

const graph = new BaseGraph({ container });
```

Such a graph renders vertices and edges, and nothing else. From there, add back exactly what the application needs, as
described in the next section.

### Where the registration code lives

Style elements can be registered in two places, and the choice is only about where the code sits. Both are equivalent
for tree-shaking, since the registries are global either way.

**Inside the class**, by subclassing `BaseGraph` and overriding `registerDefaults()`. The configuration travels with the
class definition, which is convenient when the application already has a graph subclass. This is the approach used by
the maxGraph example applications.

```typescript
class CustomGraph extends BaseGraph {
  protected override registerDefaults(): void {
    ShapeRegistry.add('ellipse', EllipseShape);
    registerOrthogonalEdgeStyle();
    // ... the other elements the application uses
  }
}
```

**Outside the class**, at application startup, before any graph instance is created. No subclass is needed, and the
registration sits at the entry point of the application.

```typescript
function registerStyleElements(): void {
  ShapeRegistry.add('ellipse', EllipseShape);
  registerOrthogonalEdgeStyle();
  // ... the other elements the application uses
}

registerStyleElements();

const graph = new BaseGraph({ container, plugins: [/* ... */] });
```

Both are detailed, with complete imports, in
[Registering style elements with BaseGraph](./graph.md#registering-style-elements-with-basegraph).


## Register Only What You Use

This is the core principle: **only load what you need, and register only the features you use.**

Style elements, plugins, codecs, i18n and the logger are all optional and registered on demand. Each family below
follows the same pattern: a global registry or configuration object, a granular registration API, and a
`registerDefault*` escape hatch that registers everything at once and therefore cancels the benefit.

:::warning
All the registries are **global**. Registering an element makes it visible to every `Graph` and `BaseGraph` instance of
the application. Registering "just in case", in a shared module, or in a helper used by tests, is enough to pull the
corresponding code into the bundle.
:::

### Shapes

Shapes are registered in `ShapeRegistry`. See [Global Configuration, Styles](./global-configuration.md#styles).

```typescript
import { EllipseShape, ShapeRegistry } from '@maxgraph/core';

ShapeRegistry.add('ellipse', EllipseShape);
```

Two shapes never need to be registered: `RectangleShape` is the fallback for vertices and `ConnectorShape` is the
fallback for edges, both configurable through `CellRenderer.defaultVertexShape` and `CellRenderer.defaultEdgeShape`.

Avoid `registerDefaultShapes()` unless the application genuinely draws all sixteen built-in shapes.

Stencil shapes are registered in `StencilShapeRegistry`, and none are registered by default with either graph class.

### Perimeters

Perimeters are registered in `PerimeterRegistry`. See the [Perimeters](./perimeters.md) page.

```typescript
import { Perimeter, PerimeterRegistry } from '@maxgraph/core';

PerimeterRegistry.add('ellipsePerimeter', Perimeter.EllipsePerimeter);
```

Note that `rectanglePerimeter` is declared in the default vertex style, so it must be registered as soon as vertices
rely on that default.

### EdgeStyles

Edge styles are registered in `EdgeStyleRegistry`, together with metadata that other features depend on. Since 0.24.0,
each built-in edge style has a dedicated helper that sets the correct metadata for you, so prefer them to a raw
`EdgeStyleRegistry.add()` call:

```typescript
import { registerOrthogonalEdgeStyle } from '@maxgraph/core';

registerOrthogonalEdgeStyle();
```

The helpers are `registerElbowEdgeStyle`, `registerEntityRelationEdgeStyle`, `registerLoopEdgeStyle`,
`registerManhattanEdgeStyle`, `registerOrthogonalEdgeStyle`, `registerSegmentEdgeStyle`,
`registerSideToSideEdgeStyle` and `registerTopToBottomEdgeStyle`. See the [EdgeStyles](./edge-styles.md) page.

The metadata matters beyond rendering: `handlerKind` selects which `EdgeHandler` implementation is instantiated when the
edge is selected. See [Choosing the handler of an edge](./cell-handlers.md#choosing-the-handler-of-an-edge).

### Edge markers

Edge markers are registered in `EdgeMarkerRegistry`. Several marker names share the same factory function, so
registering a subset costs less than the number of names suggests:

```typescript
import { EdgeMarker, EdgeMarkerRegistry } from '@maxgraph/core';

const arrowFunction = EdgeMarker.createArrow(2);
EdgeMarkerRegistry.add('classic', arrowFunction);
EdgeMarkerRegistry.add('block', arrowFunction);
```

### Plugins

`BaseGraph` loads no plugin. Pass the exact list your application needs through the `plugins` option:

```typescript
import {
  BaseGraph,
  CellEditorHandler,
  PanningHandler,
  SelectionCellsHandler,
  SelectionHandler,
} from '@maxgraph/core';

const graph = new BaseGraph({
  container,
  plugins: [CellEditorHandler, PanningHandler, SelectionCellsHandler, SelectionHandler],
});
```

See the [Plugins](./plugins.md) page for the list of available plugins and which ones `Graph` loads by default. Do not
call `getDefaultPlugins()` with `BaseGraph`, it defeats the purpose, unless the application genuinely needs all the
features it provides.

A read-only or visualization-only application typically needs very few of them. In particular, **omitting
`SelectionCellsHandler` keeps all the cell handler classes out of the bundle**, since it is the plugin that instantiates
`VertexHandler`, `EdgeHandler`, `ElbowEdgeHandler` and `EdgeSegmentHandler`. See the [Cell Handlers](./cell-handlers.md)
page.

### Codecs

Since [version 0.6.0](https://github.com/maxGraph/maxGraph/releases/tag/v0.6.0), no codec is registered by default, with
either graph class. Register only what you encode or decode, and prefer the narrow functions:

- `registerModelCodecs` for the `GraphDataModel` alone
- `registerCoreCodecs` for the core classes
- `registerEditorCodecs` for the `Editor` classes
- `registerAllCodecs` registers everything, so avoid it

If you only serialize the data model, `ModelXmlSerializer` registers the model codecs under the hood and is enough. See
the [Codecs](./codecs.md) page.

### i18n

By default, `maxGraph` uses a no-op i18n implementation that provides no translations. This is deliberate: not all
applications need internationalization, and skipping the built-in translations keeps the library lighter.

Only set `GlobalConfig.i18n` when the application actually displays translated messages, and prefer plugging your
existing i18n solution through a custom `I18nProvider` rather than enabling `TranslationsAsI18n`, which pulls the
`Translations` machinery in. See the [i18n](./i18n.md) page.

### Logger

`GlobalConfig.logger` defaults to `NoOpLogger`, which does nothing and costs nothing.

```typescript
import { ConsoleLogger, GlobalConfig } from '@maxgraph/core';

GlobalConfig.logger = new ConsoleLogger();
```

:::warning
**Do not use `MaxLogAsLogger` in production**, unless you deliberately display the UI components provided by
`maxGraph`. It directs logs to `MaxLog`, a built-in console rendered in the page, which transitively pulls `MaxWindow`
and the related DOM utilities into your bundle. Use `ConsoleLogger`, or your own `Logger` implementation, when you need
logs without the UI.
:::

### CSS and images

CSS files are the only part of the package declared as having side effects, so an imported stylesheet is never removed.
Import `@maxgraph/core/css/common.css` only if you use a feature that needs it, such as `RubberBandHandler`, and
consider providing your own rules instead. See the [CSS and Images](./css-and-images.md) page.


## What Not to Load

A checklist of the patterns that silently inflate the bundle:

- **`new Graph(container)` in production code.** It registers every built-in style element and loads every default plugin. Use [`BaseGraph`](./graph.md#basegraph).
- **`registerDefaultStyleElements()`, `registerDefaultShapes()` and the other `registerDefault*` functions** called "to be safe". They are convenience helpers for prototyping, not production defaults.
- **`registerAllCodecs()`** when the application only imports or exports the data model.
- **`MaxLogAsLogger`**, and more generally the UI elements of `maxGraph` you do not display: `MaxLog`, `MaxWindow`, `MaxPopupMenu`, `MaxToolbar`, `MaxForm`.
- **The `Editor` class and its companions** (`EditorToolbar`, `EditorPopupMenu`, `EditorKeyHandler`). This is a large legacy component inherited from `mxGraph`; do not import it unless you specifically build on it.
- **Forcing the CommonJS build**, which cannot be tree-shaken. Let your bundler resolve the `import` condition of the package `exports`.
- **Re-exporting `maxGraph` through a barrel file of your own** that your whole application imports, which can defeat the module-level analysis of some bundlers.


## Measuring the Impact

The effect of these choices is visible in the example applications shipped in the repository. Each exists in two
flavors, so that the two most common bundlers are covered:

| Example | Bundler | What it demonstrates |
|---|---|---|
| [ts-example](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example) | Vite | A `Graph`-based application, with all defaults |
| [ts-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-selected-features) | Vite | A `BaseGraph` subclass registering only the features it needs |
| [ts-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-without-defaults) | Vite | A minimal `BaseGraph`, no plugin and no style element at all |
| [js-example](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example) | Webpack | Same as `ts-example`, in JavaScript |
| [js-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-selected-features) | Webpack | Same as `ts-example-selected-features`, in JavaScript |
| [js-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-without-defaults) | Webpack | Same as `ts-example-without-defaults`, in JavaScript |

Comparing the "full", "selected features" and "without defaults" variants of the same application shows what the
registration choices are worth. From a clone of the repository, `./scripts/build-all-examples.bash` builds them all and
prints the resulting bundle sizes; `--list-size-only` prints the sizes of an existing build.

For your own application, use the bundle analyzer of your toolchain to check what `@maxgraph/core` actually contributes,
for instance `rollup-plugin-visualizer` with Vite and Rollup, `webpack-bundle-analyzer` or
[Rsdoctor](https://rsdoctor.rs/) with Webpack and Rspack, or `source-map-explorer` for any bundler producing source
maps. Measure before and after the migration described below, in your own environment.


## Guide: Improving the Tree-Shaking of an Application Using Graph

[//]: # (this guide should probably live in a page of its own. The documentation has no dedicated "Guides" section)
[//]: # (yet, this is planned for later. Move it there when the section exists, and keep a link from this page.)

**Goal**: take an existing application built on [`Graph`](./graph.md), and reduce what `maxGraph` contributes to its
bundle, without changing what the application does for its users.

Despite its name, the work is not only about swapping one graph class for another. It covers two distinct things:

1. **The graph class and what it registers**, in steps 2 to 4. `Graph` is replaced by a `BaseGraph` configured with the
   exact plugins and style elements the application uses. This is where most of the reduction comes from, and it is the
   part that only concerns applications still using `Graph`.
2. **The features that do not depend on the graph class**, in step 5. Codecs, i18n and the logger are global opt-ins
   that the application registers or configures itself, so they deserve a review whichever graph class you end up with.
   An application already built on `BaseGraph` can skip straight to that step.

Steps 1, 6 and 7 bracket the work: measure before, check the rendering, measure after.

Both graph classes share the same API through `AbstractGraph`, so this is primarily a configuration change, not an API
change. Proceed incrementally and keep the application running at every step.

The recommended strategy is **not** to start from an empty graph and guess what to add back. Start by loading
**everything**, exactly as `Graph` does, so that the application behaves as before, then **remove progressively** what
it turns out not to need. Each removal is a small, verifiable step.

Nothing prevents you from measuring at each of these steps rather than only at the end. Doing so tells you what each
removal is actually worth, and whether a given family of elements is worth trimming further.

### 1. Measure the starting point

Build the application and record the size contributed by `@maxgraph/core`, using one of the analyzers listed above.
Without this baseline, you cannot tell whether the migration paid off.

### 2. Switch the constructor, keeping all the defaults

`Graph` takes positional parameters, `BaseGraph` takes a single options object. At the same time, register explicitly
what `Graph` used to register implicitly: `getDefaultPlugins()` for the plugins, and `registerDefaultStyleElements()`
for the shapes, edge styles, perimeters and edge markers.

```typescript
// Before
const graph = new Graph(container, model, plugins, stylesheet);
```

```typescript
// After
import {
  BaseGraph,
  getDefaultPlugins,
  registerDefaultStyleElements,
} from '@maxgraph/core';

registerDefaultStyleElements();

const graph = new BaseGraph({
  container,
  model,
  stylesheet,
  plugins: getDefaultPlugins(),
});
```

As explained in [Where the registration code lives](#where-the-registration-code-lives), the call to
`registerDefaultStyleElements()` can also go into a `registerDefaults()` override in a `BaseGraph` subclass. **Prefer
the subclass when the application already extends `Graph`**, since the override then replaces the subclass you already
have, and the later steps are edits to a method you own:

```typescript
class CustomGraph extends BaseGraph {
  protected override registerDefaults(): void {
    registerDefaultStyleElements();
  }
}
```

:::note
This step alone does not reduce the bundle: the application still pulls every built-in. It is a checkpoint. The
application must behave exactly as it did with `Graph`, and any difference at this point is a migration bug, not a
missing registration. Commit here before trimming anything.
:::

### 3. Trim the plugins

Replace `getDefaultPlugins()` with an explicit list, then remove the plugins the application does not need, one at a
time, checking the application after each removal. A read-only or visualization-only application may end up with very
few of them, or none.

```typescript
const graph = new BaseGraph({
  container,
  plugins: [CellEditorHandler, SelectionCellsHandler, SelectionHandler, PanningHandler],
});
```

Check the [Available Plugins](./plugins.md#available-plugins) table for what each one provides, and remember that
dropping `SelectionCellsHandler` also drops all the cell handlers.

### 4. Trim the style elements

Proceed by family of elements, so that a rendering regression points straight at the family you just trimmed.

Start by replacing `registerDefaultStyleElements()` with the four functions it calls. Nothing is removed from the
bundle yet, but each family can now be trimmed on its own:

```typescript
// Instead of registerDefaultStyleElements()
registerDefaultShapes();
registerDefaultPerimeters();
registerDefaultEdgeStyles();
registerDefaultEdgeMarkers();
```

Then take the families one at a time. Go through the cell styles of the application, including the defaults of the
`Stylesheet` and the named styles registered with `putCellStyle`, and collect the values used by the family being
trimmed: `shape`, then `perimeter`, `edgeStyle`, and finally `startArrow` and `endArrow`.

For the shapes, drop `registerDefaultShapes()` and register exactly the shapes collected:

```typescript
// Instead of registerDefaultShapes()
ShapeRegistry.add('ellipse', EllipseShape);
```

Check the application, then iterate over the other families the same way: perimeters, edge styles, and edge markers.
Use the dedicated helper of each built-in edge style rather than registering it by hand.

At the end of the process, no `registerDefault*` call is left, and what remains is exactly what the application uses:

```typescript
ShapeRegistry.add('ellipse', EllipseShape);
PerimeterRegistry.add('ellipsePerimeter', Perimeter.EllipsePerimeter);
PerimeterRegistry.add('rectanglePerimeter', Perimeter.RectanglePerimeter);
registerOrthogonalEdgeStyle();
EdgeMarkerRegistry.add('block', EdgeMarker.createArrow(2));
```

### 5. Review the codecs, i18n and logger

Unlike the previous steps, this one is independent of the graph class: these features are global opt-ins that the
application registers or configures itself, and they are worth reviewing even when it already uses `BaseGraph`.

Register codecs only if the application imports or exports XML, and prefer the narrow `registerModelCodecs` to
`registerAllCodecs`. Set `GlobalConfig.i18n` only if the application displays translated messages. Set
`GlobalConfig.logger` to `ConsoleLogger` rather than `MaxLogAsLogger`, which pulls the `MaxLog` and `MaxWindow` UI into
the bundle. The [Register Only What You Use](#register-only-what-you-use) section details each of them.

### 6. Check for over-trimming

Removing one element too many does not throw. It degrades the rendering silently, which is what makes the incremental
approach of the previous steps worthwhile:

| Missing registration | Symptom |
|---|---|
| Shape | The fallback shape is used: `RectangleShape` for a vertex, `ConnectorShape` for an edge |
| Perimeter | No perimeter point is computed, so the edge connects to the center of the vertex bounding box |
| EdgeStyle | The routing is not applied, so the edge is drawn as a straight line between its terminals |
| Edge marker | No marker is drawn, so the arrowhead is missing |
| `EdgeStyle` metadata | The wrong `EdgeHandler` is instantiated, so the handles do not match the actual routing |

Review the diagrams visually, and pay attention to the styles exercised only by rarely used screens.

### 7. Measure again

Compare with the baseline recorded in step 1, in the same environment and with the same bundler configuration. This
gives the total gain of the migration, whereas the intermediate measurements only give the gain of a single step.


## Going Further

Further tree-shaking improvements that allow selective loading of built-in elements like shapes, plugins and editing
functionalities would enable applications to load only the necessary components, reducing the final bundle size.

This work is tracked in [issue #665](https://github.com/maxGraph/maxGraph/issues/665), which serves as the parent issue
for the topic and links all the sub-issues. The main ones still open are:

- [#758](https://github.com/maxGraph/maxGraph/issues/758): make `Graph.defaultLoopStyle` configurable with a registered `EdgeStyle` string
- [#762](https://github.com/maxGraph/maxGraph/issues/762): refactor the `Graph` class and its mixins to improve modularity and tree-shaking
- [#890](https://github.com/maxGraph/maxGraph/issues/890): make the `EdgeHandler` registration in `SelectionCellsHandler` optional and modular

The main known limitation today is that the mixins of `AbstractGraph` are still loaded as a whole, so part of the graph
API is included even when unused. Issue #762 tracks the extraction of these behaviors into dedicated plugins.
