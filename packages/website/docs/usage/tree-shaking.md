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
actually use, through the registries and configuration objects listed in the
[Global Configuration](./global-configuration.md) page.

It is the **reference** for each family of optional features: what the family is, how an element of it is registered,
and what the traps are. It deliberately does not say in which order to proceed, nor what to check between two changes.
For an application already built on `Graph`, the
[Reduce the Bundle Size of an Application](../guides/reduce-bundle-size.md) guide turns this reference into an
ordered migration.

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

| Version | Improvement | What it buys |
|---|---|---|
| 0.6.0 | Codecs are no longer registered by default | An application that never serializes a model carries no codec, where they used to be registered whether or not anything encoded or decoded |
| 0.11.0 | The graph no longer logs through `MaxLog` by default | `MaxLog` and `MaxWindow` stop being pulled in transitively, the legacy `Editor` aside, so the in-page console leaves every application that does not display it |
| 0.12.0 | The npm package is declared free of side effects, its CSS files excepted | A bundler may drop a whole unused module and its subtree, rather than only the exports it can prove unused |
| 0.17.0 | i18n becomes configurable through `GlobalConfig.i18n`, whose default provides no translation | The `Translations` machinery and the resources it loads leave every application that does not opt into them |
| 0.18.0 | `BaseGraph` is introduced, along with the `registerDefault*` functions | A graph can be built that registers nothing: shapes, perimeters, edge styles, markers and plugins become opt-in instead of arriving with the class, so only the plugins an application declares are loaded |
| 0.19.0 | `EdgeStyle` and `Perimeter` become namespaces, instead of a class holding static members and a value object | Those two shapes defeated the module level analysis of several bundlers, Webpack in particular, which can now drop the implementations an application never registers |
| 0.20.0 | The library stops naming the built-in `EdgeStyle` implementations in its own code, reading instead the metadata passed to `EdgeStyleRegistry.add()` | An unregistered edge style is no longer reachable from the library, so a bundler can drop it; this is what the per style helpers of 0.24.0 are built on |
| 0.21.0 | `AbstractGraph.fit`, with the `minFitScale` and `maxFitScale` properties, moves to `FitPlugin` | The fitting logic leaves the graph classes, so an application that does not register that plugin no longer carries it |
| 0.23.0 | The first graph mixin moves into a plugin: `TooltipMixin` disappears, its methods becoming those of `TooltipHandler` | A mixin is loaded by every graph class, a plugin only by the applications that declare it, so the tooltip code leaves the others |
| 0.24.0 | A dedicated registration helper per built-in `EdgeStyle`, the image bundle feature moves to a plugin, and `EdgeHandler` stops importing `EdgeStyle` | One edge style is registered instead of all eight, with the metadata the library reads elsewhere; the image bundle code leaves every application that does not add `ImageBundlePlugin`, and `EntityRelation` leaves those that never register it |
| 0.25.0 | The cell handlers move from `AbstractGraph` to the `SelectionCellsHandler` plugin | An application that does not register that plugin no longer bundles `VertexHandler`, `EdgeHandler`, `ElbowEdgeHandler` and `EdgeSegmentHandler` |

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

Importing `Graph` pulls the following into your bundle, whether the application uses them or not, and whether or not a `Graph` is ever constructed:

| Loaded by `Graph` | Content |
|---|---|
| `registerDefaultShapes()` | 16 built-in shapes |
| `registerDefaultEdgeStyles()` | 8 built-in edge styles |
| `registerDefaultPerimeters()` | 5 built-in perimeters |
| `registerDefaultEdgeMarkers()` | 9 built-in edge markers |
| `getDefaultPlugins()` | 9 plugins, and transitively the four cell handlers that `SelectionCellsHandler` imports |

`BaseGraph` registers **none** of them. Nothing is loaded that you did not ask for:

```typescript
import { BaseGraph } from '@maxgraph/core';

const graph = new BaseGraph({ container });
```

Such a graph renders vertices and edges, and nothing else. From there, add back exactly what the application needs, as
described in the next section, and which
[Set Up an Application on BaseGraph](../guides/configure-basegraph.md) walks through in order for a new application.

### Where the registration code lives

Style elements can be registered in two places, and the choice is only about where the code sits. Both are equivalent
for tree-shaking, since the registries are global either way.

**Inside the class**, by subclassing `BaseGraph` and overriding `registerDefaults()`. The configuration travels with the
class definition, which is convenient when the application already has a graph subclass. This is the approach used by
the maxGraph example applications.

:::warning
`registerDefaults()` is called by the constructor of `AbstractGraph` right after `super()`, before the container, the
collaborators and the plugins are set up. The method itself is overridden normally, since it lives on the prototype,
and so are the inherited methods and the members installed by the mixins, which are all callable there. What does not
exist yet is any field of your subclass, the container, and the five collaborators: reading one of them gives
`undefined`, and nothing is reported. The compiler does not report it either, since the collaborators are declared with
a definite assignment assertion, so `this.getStylesheet()` type checks and returns `undefined`, and a `putCellStyle`
call on it throws when the graph is constructed. Keep the override free of instance state, or register outside the
class.
:::

**Outside the class**, at application startup, before any graph instance is created. No subclass is needed, and the
registration sits at the entry point of the application.

Both are written out, with their imports, in
[Registering style elements with BaseGraph](./graph.md#registering-style-elements-with-basegraph).


## Register Only What You Use

This is the core principle: **only load what you need, and register only the features you use.**

Style elements, plugins, codecs, i18n and the logger are all optional, but each family opts in through its own
mechanism: style elements through their registries and the granular `register*` helpers, plugins through the `plugins`
constructor option, codecs through the codec registration functions, i18n and the logger through `GlobalConfig`.

What they share is that each offers a broad shortcut next to the narrow one: `registerDefaultStyleElements()` and the
`registerDefault*` functions, `getDefaultPlugins()`, `registerAllCodecs()`. A broad call loads the whole family at once,
so it cancels the benefit for an application that uses only a part of it. For an application that genuinely uses all of
a family, it is the right call: the bundle is the same as the list of individual registrations, and one line is easier
to write and to keep correct than fifteen. Prefer the narrowest option that covers what the application actually uses,
which is the broad one when it uses everything.

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

Two shapes never need to be registered, `RectangleShape` for vertices and `ConnectorShape` for edges, which
[Global Configuration, Styles](./global-configuration.md#styles) describes along with the fields that configure them.

Avoid `registerDefaultShapes()` unless the application genuinely draws all sixteen built-in shapes. The one exception
is the transitional step of [Reduce the Bundle Size of an Application](../guides/reduce-bundle-size.md), which calls
it before trimming it away.

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

Note that `classic` is declared as `endArrow` in the default edge style, so it must be registered as soon as edges rely
on that default, exactly as `rectanglePerimeter` must be for vertices.

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
features it provides. Migrating an existing application is the exception: the
[Reduce the Bundle Size of an Application](../guides/reduce-bundle-size.md) guide starts from `getDefaultPlugins()`
on purpose, as a checkpoint where nothing has changed yet, then trims the list from there.

A read-only or visualization-only application typically needs very few of them. In particular, **omitting
`SelectionCellsHandler` keeps all the cell handler classes out of the bundle**, since it is the plugin that instantiates
`VertexHandler`, `EdgeHandler`, `ElbowEdgeHandler` and `EdgeSegmentHandler`. See the [Cell Handlers](./cell-handlers.md)
page.

The reverse is where the granularity stops today: keeping that plugin imports the four classes, whichever edge styles
the application registered, so an application using only straight edges still ships the elbow and segment handlers.
Making that registration modular is what
[issue #890](https://github.com/maxGraph/maxGraph/issues/890) is about.

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
Import `@maxgraph/core/css/common.css` only if you use a feature that needs it, and consider providing your own rules
instead. [CSS and Images](./css-and-images.md#css) names what creates DOM needing those rules, four plugins among
other classes.


## What Not to Load

A checklist of the patterns that silently inflate the bundle:

- **`new Graph(container)` in production code.** It registers every built-in style element and loads every default plugin. Use [`BaseGraph`](./graph.md#basegraph).
- **`registerDefaultStyleElements()`, `registerDefaultShapes()` and the other `registerDefault*` functions** called "to be safe", that is without knowing which elements the application uses, which ships the whole family for the sake of a few of its members. Calling one because the application does use the whole family is a deliberate choice and costs nothing extra, and calling one as a transitional step, as [Reduce the Bundle Size of an Application](../guides/reduce-bundle-size.md) does, is a different thing from shipping it.
- **`registerAllCodecs()`** when the application only imports or exports the data model.
- **`MaxLogAsLogger`**, and more generally the UI elements of `maxGraph` you do not display: `MaxLog`, `MaxWindow`, `MaxPopupMenu`, `MaxToolbar`, `MaxForm`. `MaxPopupMenu` also arrives through `PopupMenuHandler`, which extends it, so that one leaves the bundle with the plugin rather than with an import.
- **The `Editor` class and its companions** (`EditorToolbar`, `EditorPopupMenu`, `EditorKeyHandler`). This is a large legacy component inherited from `mxGraph`; do not import it unless you specifically build on it.
- **Forcing the CommonJS build**, which cannot be tree-shaken. Let your bundler resolve the `import` condition of the package `exports`.
- **Re-exporting `maxGraph` through a barrel file of your own** that your whole application imports, which can defeat the module-level analysis of some bundlers.


## Measuring the Impact

The effect of these choices is visible in the example applications shipped in the repository. Each of the two families
comes in the same three variants, one per registration strategy, and each family uses one of the two most common
bundlers. The two families do not demonstrate the same application: the TypeScript one draws a diagram with custom
shapes, the JavaScript one imports and exports the model as XML.

| Example | Bundler | What it demonstrates |
|---|---|---|
| [ts-example](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example) | Vite | A `Graph` with all the defaults, drawing a diagram that uses custom shapes |
| [ts-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-selected-features) | Vite | The same diagram, minus the custom shapes, on a `BaseGraph` subclass registering only the elements it needs |
| [ts-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/ts-example-without-defaults) | Vite | A minimal `BaseGraph`, no plugin and no style element at all |
| [js-example](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example) | Webpack | A `Graph` with all the defaults, importing and exporting the model as XML |
| [js-example-selected-features](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-selected-features) | Webpack | The same XML application on a `BaseGraph` subclass registering only the elements it needs |
| [js-example-without-defaults](https://github.com/maxGraph/maxGraph/tree/main/packages/js-example-without-defaults) | Webpack | Same as `ts-example-without-defaults`, in JavaScript |

Comparing the three variants of one family shows what the registration choices are worth. From a clone of the maxGraph repository, `./scripts/build-all-examples.bash` builds them all and
prints the resulting bundle sizes; `--list-size-only` prints the sizes of an existing build.

Measuring your own application is a different exercise, and the guide owns it: which analyzer to set up for your
toolchain, when to measure, and what the intermediate measurements buy you over the two that bracket the work. See
[Reduce the Bundle Size of an Application](../guides/reduce-bundle-size.md).


## Going Further

Selective loading of the built-in elements, shapes, plugins, style elements and editing features, is what the rest of
this page describes: it is available today. What remains is finer-grained modularity, so that applications stop
carrying code they never reach whichever features they opt into.

This work is tracked in [issue #665](https://github.com/maxGraph/maxGraph/issues/665), which serves as the parent issue
for the topic and links all the sub-issues. The main ones still open are:

- [#758](https://github.com/maxGraph/maxGraph/issues/758): make `Graph.defaultLoopStyle` configurable with a registered `EdgeStyle` string
- [#762](https://github.com/maxGraph/maxGraph/issues/762): refactor the `Graph` class and its mixins to improve modularity and tree-shaking
- [#890](https://github.com/maxGraph/maxGraph/issues/890): make the `EdgeHandler` registration in `SelectionCellsHandler` optional and modular

The main known limitation today is that the mixins of `AbstractGraph` are still loaded as a whole, so part of the graph
API is included even when unused. Issue #762 tracks the extraction of these behaviors into dedicated plugins.

Mixins are the internal mechanism that groups the features of `AbstractGraph` by subject, `SelectionMixin`,
`EditingMixin`, `ZoomMixin` and about twenty in all, instead of declaring them all in a single class. Unlike the
built-in elements described in this page, they are not opt-in: `AbstractGraph` copies their members onto its own
prototype when its module is imported, so importing any graph class brings every mixin along. A bundler cannot trim
them, because they all end up on the same prototype and nothing indicates which ones the application actually calls.
Converting them to plugins, which are opt-in by construction, is what issue #762 is about.

Mixins also surface when you extend the library, since a member coming from one is overridden differently, see
[Subclassing a graph class](../guides/extend-maxgraph.md#a-graph-class).
