# ADR 0002: Use plugins for optional behaviour and new features

- **Status**: Accepted
- **Date**: documented retrospectively on 2026-08-10. The plugin system predates this ADR: `getDefaultPlugins` exists
  since 0.13.0, `FitPlugin` since 0.17.0, the `BuiltinPluginId` union since 0.20.0, `ImageBundlePlugin` since 0.24.0
- **Scope**: `packages/core/src/view/plugin/`, `packages/core/src/types.ts`, `packages/core/src/view/AbstractGraph.ts`
- **Analysis basis**: commit `5c8cf90d8`, during the development of version 0.25.0. Any file or line reference below
  points to that commit
- **Related**: [ADR 0001](0001-use-mixins-to-split-the-graph-class.md),
  [ADR 0003](0003-move-members-out-of-abstract-graph.md),
  [issue #762](https://github.com/maxGraph/maxGraph/issues/762),
  **[discussion #51](https://github.com/maxGraph/maxGraph/discussions/51): first mention of the plugin system**,
  [discussion #151](https://github.com/maxGraph/maxGraph/discussions/151#discussioncomment-4376164),
  user documentation: [`plugins.md`](../../packages/website/docs/usage/plugins.md),
  [`migrate-from-mxgraph.md`](../../packages/website/docs/usage/migrate-from-mxgraph.md)

## Context

[ADR 0001](0001-use-mixins-to-split-the-graph-class.md) split the God object into mixins. That solved readability and
kept the public API intact, but it left three problems unsolved, and created a fourth:

- **No tree-shaking.** Every mixin is applied unconditionally, so a consumer using none of the swimlane API still ships
  `SwimlaneMixin`. Tree-shaking was one of the goals that motivated the split in the first place.
- **No per-instance state.** Mixin members live on the prototype, so a mutable default is shared by every graph
  instance. `mixInto` documents this limitation and states it will not be fixed.
- **No extension point.** A mixin cannot be swapped, disabled, or replaced by a consumer. Customising behaviour means
  subclassing `Graph` and overriding methods.
- **A growing class again.** Anything new with nowhere else to go lands back on `AbstractGraph`, which is how the class
  reached 1337 lines despite 21 mixins existing.

The plugin system was first proposed in [discussion #51](https://github.com/maxGraph/maxGraph/discussions/51), where a
configurable plugin system is named as the eventual replacement for the namespace split then being used to make
tree-shaking possible.

Meanwhile the codebase already had a working answer for part of this. The `mxGraph` handlers were per-instance
collaborators created by the `Graph` constructor, and they were gradually turned into registered plugins. Seven
properties and their factory methods were removed in the process, documented in
[`migrate-from-mxgraph.md`](../../packages/website/docs/usage/migrate-from-mxgraph.md): `cellEditor`,
`connectionHandler`, `graphHandler`, `panningHandler`, `popupMenuHandler`, `selectionCellsHandler` and `tooltipHandler`,
each replaced by a `getPlugin` call. That conversion is the precedent this ADR generalises, and its migration table is
also the honest measure of what a plugin migration costs users.

## Decision

**Plugins are the extension unit of `maxGraph`.** They serve two purposes, and both matter equally:

1. **Destination for code moving out of `AbstractGraph` and out of the mixins.** This is the direction tracked by
   [issue #762](https://github.com/maxGraph/maxGraph/issues/762). `ImageMixin` becoming `ImageBundlePlugin` is the
   reference example.
2. **Home for new features.** A new capability is added as a plugin by default, not as methods on `AbstractGraph` and
   not as a new mixin. This is what stops the class from growing back. A feature only belongs on `AbstractGraph` if it
   is required for any graph to function at all.

### Contract

```typescript
export interface GraphPlugin {
  onDestroy: () => void;
}

export interface GraphPluginConstructor {
  pluginId: PluginId;
  new (graph: AbstractGraph): GraphPlugin;
}
```

- A plugin is a class with a `static readonly pluginId`, taking the graph in its constructor.
- Instances are created by the `AbstractGraph` constructor, one per graph, from the `plugins` option, and stored in a
  private `Map` keyed by `pluginId`.
- Consumers retrieve them with `graph.getPlugin<MyPlugin>('my-plugin')`, which returns `undefined` when the plugin is
  not registered.
- `AbstractGraph.destroy` calls `onDestroy` on every registered plugin.

### Registration and defaults

- `Graph` loads `getDefaultPlugins()`, so a new plugin added there is invisible to `Graph` users.
- `BaseGraph` loads nothing: its users opt in explicitly through the `plugins` option.
- Built-in ids are listed in the `BuiltinPluginId` union in `types.ts`, which gives autocompletion on `getPlugin` while
  `PluginId` still accepts any string for third-party plugins.

### Naming

Codified in [`.claude/rules/architecture/coding-practices.md`](../../.claude/rules/architecture/coding-practices.md):

- ids are kebab-case (`'image-bundle'`), single-word ids stay lowercase (`'fit'`);
- ids carry no `Plugin` or `Handler` suffix, they are not class names;
- ids state a precise scope, so the broader namespace stays available: `'image-bundle'` rather than `'image'`;
- class names are PascalCase and end in `Plugin`.

The legacy handler ids (`'ConnectionHandler'`, `'PanningHandler'` and siblings) predate this convention and are kept for
backwards compatibility. They are not a template. The corresponding `*Handler.ts` files are to be renamed to `*Plugin.ts`
in due course.

### Optional behaviour must degrade gracefully

Core code that calls into a plugin must behave sensibly when that plugin is absent, since `BaseGraph` users may not have
registered it. The pattern is a nullish call followed by a defensible fallback, not a throw.

`ImageBundlePlugin` is the reference: `postProcessCellStyle` delegates bundle-key resolution to it, and when the plugin
is not registered the lookup is silently skipped and the raw `style.image` key is used as the image path.

## Consequences

### Positive

- **Per-instance state.** Plugins are constructed per graph, so the shared-state trap of ADR 0001 simply does not exist
  for them. A group of members blocked from moving to a mixin by a mutable default can move to a plugin unchanged.
- **Real tree-shaking.** A plugin that is never referenced is never bundled. This is the only mechanism in the codebase
  that actually reduces bundle size, mixin moves do not.
- **A genuine extension point.** Consumers can replace a built-in plugin with their own implementation by passing it
  instead of the original, without subclassing `Graph`.
- **`AbstractGraph` stops growing.** New features have a home that is not the God object.

### Negative

- **Migrating an existing member is a breaking change.** `graph.addImageBundle(bundle)` becomes
  `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.addImageBundle(bundle)`. Every migration needs a `BREAKING
  CHANGE` footer, a `CHANGELOG.md` entry and a migration note.
- **Discoverability drops.** An API reachable through `getPlugin` is less discoverable than a method on the graph
  object, and it is no longer found by autocompletion on `graph.`.
- **Call sites need fallbacks.** Every internal caller of a plugin method gains a nullish path, and each one is a small
  behavioural decision: what does the graph do when the feature is absent.
- **Two plugins can conflict.** Registering both a built-in plugin and a custom replacement leads to non-deterministic
  behaviour, for instance two listeners on the same event. The user documentation warns about it; nothing enforces it.
- **The API is still under development**, as stated in the user documentation. Expect changes to the contract itself.

## Application

- New feature: write a plugin. Add it to `getDefaultPlugins()` only if `Graph` is expected to have it by default.
- Existing feature moving out of `AbstractGraph` or a mixin: a plugin is the target, subject to the breaking-change cost
  above. [ADR 0003](0003-move-members-out-of-abstract-graph.md) applies this to the members currently in
  `AbstractGraph`, and uses existing mixins as interim destinations where a plugin is not yet warranted.
- Checklist when adding a plugin: the `*Plugin.ts` file in `view/plugin/`, its export in `view/plugin/index.ts`, the id
  in the `BuiltinPluginId` union, `getDefaultPlugins()` if applicable, the plugin table in
  `packages/website/docs/usage/plugins.md`, and a `CHANGELOG.md` entry when it replaces existing API.
