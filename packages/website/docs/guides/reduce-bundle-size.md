---
sidebar_position: 20
description: Move an existing application from Graph to BaseGraph step by step and reduce what maxGraph adds to its bundle.
---

# Reduce the Bundle Size of an Application

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::

**Goal**: take an existing application built on [`Graph`](../usage/graph.md), and reduce what `maxGraph` contributes
to its bundle, without changing what the application does for its users.

This guide was written and verified with `maxGraph` 0.25.0, which step 2 requires since it uses
`registerDefaultStyleElements`. Earlier versions are not covered.

A new application does not need this procedure, since it has nothing to remove:
[Set Up an Application on BaseGraph](./configure-basegraph.md) builds the same configuration from the other end.

## Before you start

- **An application that builds and runs**, since every step below ends by checking it.
- **A production build whose emitted size you can read**, since steps 1 and 7 compare it.
- **The list of cell styles your application uses**, including those loaded from XML at runtime, which step 4 needs.

This guide assumes you know how the two graph classes differ, see
[Graph vs BaseGraph](../usage/graph.md#graph-vs-basegraph).

## How the migration is organized

This guide is the **procedure**: what to do, in which order, and what to check between two steps. It does not
redocument each family of optional features, [Tree-Shaking](../usage/tree-shaking.md) being the reference for those,
and each step below links to the section that owns the family it touches.

The work is not only about swapping one graph class for another. It covers two distinct things:

1. **The graph class and what it registers**, in steps 2 to 4. `Graph` is replaced by a `BaseGraph` configured with the
   exact plugins and style elements the application uses. This is where most of the reduction comes from, and it is the
   part that only concerns applications still using `Graph`.
2. **The features that do not depend on the graph class**, in step 5. Codecs, i18n and the logger are global opt-ins
   that the application registers or configures itself, so they deserve a review whichever graph class you end up with.
   An application already built on `BaseGraph` can skip straight to that step.

Steps 1, 6 and 7 bracket the work: measure before, check the rendering, measure after. The two measurements that
decide are those of step 1 and step 7, since they alone give the total gain of the migration. Nothing prevents you
from measuring after each intermediate step as well: it costs one build per step, and it turns the migration into a
ranking of what `maxGraph` was actually costing the application, which plugins, which family of style elements, which
global opt-in weighed the most. That ranking is what tells you where the remaining weight sits, and whether a family
is worth trimming further.

Both graph classes inherit the same graph API from [`AbstractGraph`](../usage/graph.md#abstractgraph), so the calls the application makes on the graph do
not change. What differs is the construction: `Graph` takes positional arguments and loads its defaults on its own,
`BaseGraph` takes an options object and requires the plugins and style elements to be declared explicitly. Proceed
incrementally and keep the application running at every step.

The recommended strategy is **not** to start from an empty graph and guess what to add back. Start by loading
**everything**, exactly as `Graph` does, so that the application behaves as before, then **remove progressively** what
it turns out not to need. Each removal is a small, verifiable step.

## 1. Measure the starting point

Run the production build and record the size of the files it emits, the bundle and the extracted CSS. Without this
baseline, you cannot tell whether the migration paid off. Record how you obtained it too, since step 7 compares the
same command in the same configuration. Expect the reduction to come from the JavaScript alone, the steps below
removing no CSS.

A bundle analyzer answers a different question, which modules make up that size, so reach for one only when a number
surprises you: `rollup-plugin-visualizer` with Vite and Rollup, `webpack-bundle-analyzer` or
[Rsdoctor](https://rsdoctor.rs/) with Webpack and Rspack, `source-map-explorer` with any bundler producing source maps.
Most of them open a report in a browser rather than printing a total, and several change the build configuration,
source maps in particular, so the build they analyze is not the one you ship.

## 2. Switch the constructor, keeping all the defaults

### TypeScript, widen the annotations first

`Graph` and `BaseGraph` are siblings, both extending
[`AbstractGraph`](../usage/graph.md#abstractgraph), rather than one extending the other. A `BaseGraph` is therefore not
assignable to anything annotated `Graph`, and switching the constructor first turns every such annotation into a
compilation error at once.

So start by replacing `Graph` with `AbstractGraph` everywhere the type is written rather than instantiated: the fields
and constants that hold the graph, the parameters and return types of your functions and methods, and the type
arguments of the collections that carry it. An application that only ever lets the type be inferred has nothing to
change here, which is a legitimate outcome of this search rather than a sign of having missed something.

```typescript
// Before
let graph: Graph;
function registerListeners(graph: Graph): void { ... }

// After
let graph: AbstractGraph;
function registerListeners(graph: AbstractGraph): void { ... }
```

`AbstractGraph` holds the whole graph API, so nothing else changes and the application still compiles and runs on
`Graph`, which makes this a commit of its own. The only members it does not declare are the five `create*` factory
methods specific to `Graph`, and those are meant to be overridden in a subclass rather than called on an instance. The
next paragraph replaces them anyway, with the collaborators of the options object.

Only the instantiation site keeps a concrete class, since `AbstractGraph` is abstract. That is what lets the two
classes coexist while you migrate, and what keeps the switch below to a single statement.

### The constructor itself

`Graph` takes positional parameters, `BaseGraph` takes a single options object. At the same time, register explicitly
what `Graph` used to register implicitly: `getDefaultPlugins()` for the plugins, and `registerDefaultStyleElements()`
for the shapes, edge styles, perimeters and edge markers.

```typescript
// Before, positional: (container, model, plugins, stylesheet)
const graph = new Graph(container, undefined, [
  ...getDefaultPlugins(),
  RubberBandHandler,
]);
```

`Graph` falls back to `getDefaultPlugins()` only when the `plugins` argument is omitted or `undefined`, an explicit
empty array loading nothing, so keep the list the application already passes, including whatever it adds on top of the
defaults.

```typescript
// After
import {
  BaseGraph,
  getDefaultPlugins,
  registerDefaultStyleElements,
  RubberBandHandler,
} from '@maxgraph/core';

registerDefaultStyleElements();

const graph = new BaseGraph({
  container,
  plugins: [...getDefaultPlugins(), RubberBandHandler],
});
```

An argument the application left out, the model and the stylesheet in that example, simply has no key in the options
object. Add `model` and `stylesheet` when it does pass them, as instances in both cases.

As explained in [Where the registration code lives](../usage/tree-shaking.md#where-the-registration-code-lives), the call to
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

That method runs from the constructor of `AbstractGraph`, before any field of the subclass exists, so keep it free of
instance state, as the warning of
[Where the registration code lives](../usage/tree-shaking.md#where-the-registration-code-lives) details.

### If the application extends `Graph`

Change `extends Graph` into `extends BaseGraph`, and move the construction options to the call site as above. One thing
does not survive that change: the collaborator factories.

`createCellRenderer`, `createGraphDataModel`, `createGraphView`, `createSelectionModel` and `createStylesheet` are
declared by `Graph` alone, not by `AbstractGraph`. `BaseGraph` builds its collaborators from the options object
instead, so **delete the overrides** and pass the collaborator to the constructor.

```typescript
// Before
class CustomGraph extends Graph {
  override createCellRenderer(): CellRenderer {
    return new CustomCellRenderer();
  }

  override createGraphView(): GraphView {
    return new CustomGraphView(this);
  }
}

const graph = new CustomGraph(container);
```

```typescript
// After
class CustomGraph extends BaseGraph {
  protected override registerDefaults(): void {
    registerDefaultStyleElements();
  }
}

const graph = new CustomGraph({
  container,
  cellRenderer: new CustomCellRenderer(),
  view: (graph) => new CustomGraphView(graph),
  plugins: getDefaultPlugins(),
});
```

The two options do not have the same shape: `cellRenderer`, `model` and `stylesheet` are instances, `view` and
`selectionModel` are factories receiving the graph, and the `this` of the former override becomes the parameter of the
factory. [A collaborator](./extend-maxgraph.md#a-collaborator) explains why.

:::warning
Deleting the overrides is not optional. Left on a `BaseGraph` subclass, they compile and are never called, so the graph
silently uses the default `CellRenderer` and `GraphView`, with nothing in the console to say so. TypeScript catches
only the ones still carrying the `override` keyword, since the member no longer exists in the base class. In
JavaScript nothing is reported at all, so go through the five names above one by one.
:::

:::note
This step alone does not reduce the bundle: the application still pulls every built-in. It is a checkpoint. The
application must behave exactly as it did with `Graph`, and any difference at this point is a migration bug, not a
missing registration. Commit here before trimming anything.
:::

## 3. Trim the plugins

Replace `getDefaultPlugins()` with an explicit list, then remove the plugins the application does not need, one at a
time, checking the application after each removal. A read-only or visualization-only application may end up with very
few of them, or none.

The list to start from is the one step 2 produced: the list the application already passed to the `Graph` constructor,
the defaults plus anything it added on top such as `RubberBandHandler`, or the content of `getDefaultPlugins()` alone
when it passed none. Three passes over it tell you what to keep.

### Pass 1: the plugins the application calls

A plugin the code reaches for is a plugin that must stay. The only way to reach one is `getPlugin`, so search the
application for its call sites:

```shell
grep -rn 'getPlugin' src/
```

Each hit names the id of a required plugin. Map that id back to the class to put in the list with the `Id` column of
the [Available Plugins](../usage/plugins.md#available-plugins) table.

This pass gives the floor, and forgetting one of its results is the mistake that gets caught the latest: `getPlugin`
returns `undefined` instead of throwing, so the call site fails only when the screen using it is opened, unless the
application asserts the result as the [Retrieving and Using a Plugin](../usage/plugins.md#retrieving-and-using-a-plugin)
section describes.

An application that only reaches a plugin through `getPlugin<PanningHandler>('PanningHandler')` often imports the class
with `import type`, which is all that call needs. The `plugins` option needs the class itself, so that import has to
become a value import, otherwise the compiler reports `error TS1361: 'PanningHandler' cannot be used as a value because
it was imported using 'import type'`.

The pass does not tell you why each plugin is there. The
[Kind column](../usage/plugins.md#what-the-kind-column-means) does. For a plugin of kind `API`, the call is its only
reason to exist: `graph.getPlugin('fit')` is the whole of `FitPlugin`. For one of kind `Behavior`, the call only sets a
flag or replaces an extension point of a feature that runs anyway, so the next pass would have kept that plugin
regardless.

### Pass 2: the behaviors to keep

The plugins that pass 1 did not find are not referenced anywhere in the application, which does not mean they are
unused. A plugin of kind **Behavior** works on its own as soon as it is registered, so nothing in the code points at
it, and removing it silently removes something the user can do: `SelectionHandler` is what lets cells be moved and
cloned with the mouse, `CellEditorHandler` what lets a label be edited in place, `SelectionCellsHandler` what draws the
handles of a selected cell.

Go through what is left of the list with that same column and keep the interactions the application is meant to offer. This is a product decision rather than a technical one,
and it is where a read-only application saves the most.

### Pass 3: the plugins the graph configuration switches on

Four plugins keep the feature they exist for switched off until the application turns it on, and three of them are
turned on through a call made on the graph rather than on the plugin. That call names no plugin, so neither pass above finds it, and dropping the
plugin leaves a call that compiles, runs, and silently has no effect:

```shell
grep -rn 'setConnectable\|setPanning\|setTooltips' src/
```

Ignore the hits made on a `Cell`, which also carries a `setConnectable` and has nothing to do with the plugin.
[The plugins you must switch on](../usage/plugins.md#the-plugins-you-must-switch-on) maps each call to the plugin it
requires, and covers the fourth, `PopupMenuHandler`, whose `factoryMethod` is set on the plugin itself and therefore
already appeared in pass 1.

This pass cuts both ways, and the other direction is the one that saves: the feature a plugin of that table exists for
is off today, so removing the plugin takes away nothing the application was offering. Read that section for what stays
behind all the same, two of the four keeping a residual reaction to input.

A plugin that none of the three passes kept is one the application neither calls, nor relies on for an interaction,
nor switches on. Remove it, and check the application, as for the others. What the step changes is the single option
left by step 2:

```typescript
// Before, the checkpoint of step 2
plugins: [...getDefaultPlugins(), RubberBandHandler],

// After, the result of the three passes
plugins: [
  CellEditorHandler,
  SelectionCellsHandler,
  SelectionHandler,
  PanningHandler,
  RubberBandHandler,
],
```

`RubberBandHandler` stays: it is not one of the defaults, the application added it deliberately, and pass 2 keeps it
for the same reason it keeps the other behaviors.

The [Plugins](../usage/tree-shaking.md#plugins) section gives the complete construction and the imports that go with
it.

:::note
`SelectionCellsHandler` belongs to passes 1 and 2 at once. Applications retrieve it to customize the handles, so pass 1
usually finds it, but it is also what creates them in the first place: dropping it drops all the
[cell handlers](../usage/cell-handlers.md), so selected cells lose their border and their resize, bend and reconnect
handles. Moving a cell is `SelectionHandler`, not a handle, so it survives. Keeping the plugin has a cost of its own,
which the [Plugins](../usage/tree-shaking.md#plugins) section states.
:::

The alignment guides do not decide whether `SelectionHandler` stays. They are disabled by default, and enabled by
setting `guidesEnabled` on the plugin instance, so pass 1 finds that line when the application uses them. Either way,
`SelectionHandler` imports the `Guide` class, so keeping the plugin ships it even when the guides stay disabled, and
nothing in the application can remove it today. See [Alignment Guide](../usage/alignment-guide.md#bundle-size).

:::tip
`noUnusedLocals` in `tsconfig.json` is what turns each removal here and in step 4 into a compiler message. A plugin
dropped from the list leaves its import behind, and the build stays green without that option. The bundler does remove
an unused import, so the leftover costs nothing in the bundle, but it does suggest to the next reader that the plugin
is still loaded.
:::

## 4. Trim the style elements

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

Then take the families one at a time. Go through the cell styles of the application, including the named styles
registered with `putCellStyle` and the defaults of the `Stylesheet`, which apply to every cell that does not override
them and which `graph.getStylesheet().getDefaultVertexStyle()` and `getDefaultEdgeStyle()` print at runtime. Those
defaults alone are often the only reason a registration has to be kept. Collect the values used by the family being
trimmed: `shape` and `indicatorShape`, which both name a registered shape, then `perimeter`, `edgeStyle`, and finally
`startArrow` and `endArrow`.

A `perimeter` or an `edgeStyle` may hold the function itself rather than the name of a registered one, and those two
properties alone accept it. There is nothing to register for such a value, since the style already carries the
implementation, and nothing to remove either. The metadata of `EdgeStyleRegistry` is keyed by the function rather than by the name,
so a built-in edge style registered through its helper keeps it even when a style holds the function directly. A
function that was never registered has none, and the edge handler chosen for it is then the default one.

:::note
Only the `registerDefault*` calls are in question here. The registrations the application makes for its own shapes,
perimeters, edge styles and markers stay exactly as they are: they name elements no built-in provides, and
[Adding a new custom `Shape`](./extend-maxgraph.md#adding-a-new-custom-shape) covers them.
:::

For the shapes, drop `registerDefaultShapes()` and register exactly the shapes collected, one
[`ShapeRegistry.add`](../usage/tree-shaking.md#shapes) call each. That section also names the two shapes you never have
to register, being the fallbacks the renderer uses when a name resolves to nothing.

A family the application does not use at all is the easiest case, and the one no example here shows: drop its
`registerDefault*` call and add nothing in its place. It happens more often than it sounds, an application whose edges
are all drawn straight uses no `edgeStyle` at all, and it is usually where the largest single reduction of this step
comes from, since a whole family of implementations leaves the bundle at once.

Check the application, then iterate over the other families the same way:
[perimeters](../usage/tree-shaking.md#perimeters), [edge styles](../usage/tree-shaking.md#edgestyles) and
[edge markers](../usage/tree-shaking.md#edge-markers), each section giving the registry, the imports and the traps of
its family. Two of those traps decide what this step can remove: the `Stylesheet` contributes a perimeter and an edge
marker that no cell of yours names, and a built-in edge style has to go through its own helper rather than a raw
`EdgeStyleRegistry.add()`.

At the end of the process, no `registerDefault*` call is left, and what remains is exactly what the application uses:

```typescript
ShapeRegistry.add('ellipse', EllipseShape);
PerimeterRegistry.add('ellipsePerimeter', Perimeter.EllipsePerimeter);
PerimeterRegistry.add('rectanglePerimeter', Perimeter.RectanglePerimeter);
registerOrthogonalEdgeStyle();
// 'block' because every edge of this application names it,
// so none falls back to the 'classic' of the default style
EdgeMarkerRegistry.add('block', EdgeMarker.createArrow(2));
```

That example keeps something from each family, which is not the rule. An application drawing plain rectangles and
plain edges, and relying on the `Stylesheet` defaults for both, ends with two lines: the `rectanglePerimeter`
registration and the `classic` marker. It registers no shape at all, since the two fallbacks cover it, and no edge
style, since its default style names none.

## 5. Review the codecs, i18n and logger

Unlike the previous steps, this one is independent of the graph class: these features are global opt-ins that the
application registers or configures itself, and they are worth reviewing even when it already uses `BaseGraph`.

Review the three in turn, the codecs, `GlobalConfig.i18n` and `GlobalConfig.logger`, against
[Register Only What You Use](../usage/tree-shaking.md#register-only-what-you-use), which gives the narrow registration
to prefer in each case. Leave a setting alone when the application never touched it, the defaults already costing the
least.

The codecs carry a trap that belongs to this step rather than to that section: look for the registration call instead
of assuming it, because an application using `ModelXmlSerializer` has none, its constructor calling
`registerModelCodecs()` itself, so the model codecs are in the bundle whatever you do. The question there is not which
codecs to register, it is whether `ModelXmlSerializer` is the right tool, the alternative being the raw `Codec` API
with the registrations you choose.

Take the same pass over the stylesheets and the UI components: an imported CSS file is never removed, and the legacy
`Editor`, `MaxToolbar` or `MaxPopupMenu` classes weigh as much as they did under `Graph`. See
[What Not to Load](../usage/tree-shaking.md#what-not-to-load). `MaxPopupMenu` deserves a second look, since
`PopupMenuHandler` extends it: keeping that plugin keeps the class, and only step 3 can remove it. A stylesheet is
often imported for a plugin, [four of them](../usage/css-and-images.md#css) relying on the one shipped by the package,
so this is the place to drop an import that step 3 has just made pointless.

## 6. Check for over-trimming

Removing one element too many does not throw. It degrades the rendering silently, which is what makes the incremental
approach of the previous steps worthwhile:

| Missing registration | Symptom |
|---|---|
| Shape | The fallback shape is used: `RectangleShape` for a vertex, `ConnectorShape` for an edge |
| Perimeter | No perimeter point is computed, so the edge connects to the center of the vertex bounding box |
| EdgeStyle | The routing is not applied, so the edge is drawn as a polyline through the waypoints of its geometry, which is a straight line between its terminals when it has none |
| Edge marker | Nothing is drawn where the style named a marker, `startArrow` at the source and `endArrow` at the target, whether that symbol was an arrow head or another one |
| `EdgeStyle` metadata | The wrong `EdgeHandler` is instantiated, so the handles do not match the actual routing |

Review the diagrams visually, and pay attention to the styles exercised only by rarely used screens. The first
symptoms are also assertable, which is worth doing when the application has tests: a missing perimeter moves the
absolute points of an edge onto the centre of the vertex bounding box, and a missing marker removes a child node from
the SVG of the edge.

## 7. Measure again

Compare with the baseline recorded in step 1, in the same environment and with the same bundler configuration. This
gives the total gain of the migration, whereas the intermediate measurements only give the gain of a single step.

:::info
The figures below were measured with `maxGraph` 0.25.0, on the production build of each example, webpack for the
JavaScript pair and Vite for the TypeScript one. They are given as a ratio to expect rather than as a size to reach: a
later release changes what the library weighs, not the shape of the reduction this procedure produces.
:::

As an order of magnitude, the maxGraph repository ships both ends of this procedure. `js-example`, an editable graph
that imports and exports its model as XML and offers rubber band selection and panning, weighs about 467 kB.
`js-example-selected-features`, the same application once migrated, weighs about 385 kB. Both are built by
`./scripts/build-all-examples.bash`, so that comparison is reproducible from a clone of it, and each figure is the
largest JavaScript file the example emits, which is what that script prints.

Going further than the shipped variant does, by also dropping the label editor that this application never uses,
brought a local run of the procedure to about 373 kB, a fifth below the baseline, the gain splitting almost evenly
between the plugins of step 3 and the style elements of step 4. An application using more of `maxGraph` saves
proportionally less, and a read-only one saves more.

It ships the same pair for Vite: `ts-example`, a `Graph` with all the defaults drawing a diagram built on
custom shapes, weighs about 429 kB, and `ts-example-selected-features`, its migrated counterpart, about 362 kB. These
seven steps are what separates them. The shipped variant also drops the two custom shape classes and reproduces their
appearance with plain style properties, which is not part of this procedure, but those classes are application code
and live in another chunk, so the two figures above are unaffected.
