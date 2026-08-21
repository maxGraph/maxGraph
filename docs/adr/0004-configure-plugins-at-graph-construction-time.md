# ADR 0004: Configure plugins at graph construction time

- **Status**: Proposed. The lifecycle hook is described, the shape of the options is open: two shapes and one variant
- **Date**: 2026-08-20
- **Deadline**: before `0.25.0` ships. `GraphPluginOptions` and its only member are unreleased, so the shape can still
  change for free. Once released, every change to it breaks applications
- **Scope**: `packages/core/src/types.ts` (`GraphOptions`, `GraphCollaboratorsOptions`, `GraphPluginOptions`,
  `GraphPlugin`), `packages/core/src/view/AbstractGraph.ts`, `packages/core/src/view/plugin/`
- **Analysis basis**: commit `cd8701bc1`, during the development of version 0.25.0. Any file or line reference below
  points to that commit
- **Related**: [ADR 0002](0002-use-plugins-for-optional-and-new-features.md),
  [issue #890](https://github.com/maxGraph/maxGraph/issues/890),
  [issue #1149](https://github.com/maxGraph/maxGraph/issues/1149): the issue this ADR decides,
  [issue #1150](https://github.com/maxGraph/maxGraph/issues/1150): its second consumer, user documentation:
  [`plugins.md`](../../packages/website/docs/usage/plugins.md),
  [`cell-handlers.md`](../../packages/website/docs/usage/cell-handlers.md)

## Context

### A plugin cannot be configured while the graph is built

`GraphPlugin` declares `onDestroy` and nothing else, so the graph hands nothing to a plugin. An application configures
one by fetching the instance after construction and mutating it:

```ts
const graph = new BaseGraph({ container, plugins: [RubberBandHandler] });
graph.getPlugin<RubberBandHandler>('RubberBandHandler')!.fadeOut = true;
```

Three consequences:

- **it can be too late.** Anything the plugin reads during the first render or the first selection has already been read
  with its default value;
- **the application has to know internals**: the plugin id as a string, the class for the generic parameter, and the
  mutable property names. A typo in the id yields `undefined`, so the line above becomes a silent no-op or a runtime
  error, depending on the non-null assertion;
- **nothing is discoverable.** The graph options are the documented entry point of the library, and they say nothing
  about what the registered plugins accept.

Readability alone justifies the feature, even when timing does not: naming a plugin and its configuration in the same
place beats fetching the instance afterwards, repeating the id as a string and asserting it is not `undefined`. That is
the whole content of [issue #1150](https://github.com/maxGraph/maxGraph/issues/1150) for `RubberBandHandler`.

Third-party plugins get nothing at all: the options type is closed, so a plugin published on npm cannot add its own
configuration, even though `PluginId` accepts any string and custom plugins are a documented feature.

### The exception this work introduces, and what it costs

Making the edge handler registration modular needed the factories before the first selection, so `GraphPluginOptions`
was extracted and the graph forwards its only member, `edgeHandlerFactories`, to `SelectionCellsHandler` through the
private `AbstractGraph.configureEdgeHandlerFactories`, called after the plugins are instantiated and before
`view.revalidate()`.

It works, and it is the only mechanism available today. Its costs:

- `AbstractGraph` hardcodes the plugin id `'SelectionCellsHandler'` and the setter it calls, so the graph knows about
  one specific plugin, which is exactly what [ADR 0002](0002-use-plugins-for-optional-and-new-features.md) moves away
  from;
- it adds **0.23 kB** to every application, including one that registers no plugin at all, measured on
  `ts-example-without-defaults`;
- it does not scale: one option to forward means one more method on `AbstractGraph`.

### What this ADR settles

`GraphOptions` is the single parameter of the `AbstractGraph` constructor. It is a flat intersection of three groups,
and each group exists because a distinct phase of the constructor consumes it:

- what the graph is built from: `container` and `plugins`;
- what it delegates to its collaborators: `GraphCollaboratorsOptions`, which carries `model`, `view`, `stylesheet`,
  `cellRenderer` and `selectionModel`;
- what it hands over to its plugins: `GraphPluginOptions`.

The third group is new, and it holds exactly one member. Two groups make a convention, and every option added from now
on will follow the shape of this one by imitation. The question is therefore not "where does `edgeHandlerFactories` go",
but "how is any plugin configured from the graph options, for the next years".

Two decisions answer it, and they cannot be separated: how a plugin receives its configuration, _D1_, and how that
configuration is written in the options, _D2_. The second one is still open.

## Decision

### D1. A plugin receives its configuration through an optional `onConfigure` hook

`GraphPlugin` gains a second member, optional so that every existing plugin and every plugin published outside this
repository keeps compiling and keeps working:

```ts
export interface GraphPlugin {
  onDestroy: () => void;
  onConfigure?: (options: GraphPluginOptions) => void;
}
```

`AbstractGraph` calls it for each registered plugin, at the exact point where `configureEdgeHandlerFactories` is called
today: after every plugin is instantiated, so a plugin may reach a sibling, and before `view.revalidate()`, so the
configuration applies to the first render and the first selection.

The iteration starts from the plugins that were **actually registered**, and each one pulls the configuration it
understands. Two things follow:

- the hardcoded forwarding disappears. `AbstractGraph.configureEdgeHandlerFactories` is deleted,
  `SelectionCellsHandler` reads `edgeHandlerFactories` from its own `onConfigure`, and the 0.23 kB moves into the
  plugin, so an application registering no plugin stops paying for it. The method was deliberately kept as a single
  isolated private block to make that extraction trivial;
- a configuration entry for a plugin that is **not** registered is a silent no-op, and it is undetectable by
  construction: detecting it would need a mapping from option key to owning plugin, which cannot exist for a custom
  plugin whose package is not even installed. This is the rationale of decision _D2_ of the `#890` plan, and it matches
  the existing precedent, `AbstractGraph.setTooltips` no-ops through `?.` when `TooltipHandler` is absent. Whether the
  shape retained in _D2_ makes detection possible after all, and whether to then warn, is part of that decision.

Left open, to settle when the hook is implemented: what a plugin is allowed to do from `onConfigure`, and what it must
not do.

### D2. The shape of the plugin options

**Open.** Two shapes and one variant, none retained yet. The examples below are illustrations, nothing in them is
decided: they use the only configuration that exists today, the edge handler factories of `SelectionCellsHandler`, and a
key derived from its current id.

#### The rule every shape shares

The key identifying a group of options derives from the **plugin id**, never from the plugin class name:

- the id is the runtime identity, the one `getPlugin('fit')` takes, and the only thing a custom plugin is guaranteed to
  expose;
- a custom plugin is free to name its class anything, so a rule based on the class name would not apply to it;
- the class name happens to coincide anyway, since the naming convention already forces
  `class = PascalCase(id) + 'Plugin'`. That coincidence is a mnemonic, not the rule.

Deriving the key from the id in `camelCase` also keeps it a valid identifier: `imageBundle` for `'image-bundle'`, rather
than the quoted `'image-bundle'` a verbatim kebab-case id would impose.

#### Option A: one member per plugin, at the top level of the graph options

The member name is `camelCase(pluginId)` suffixed by `Plugin`, so `'image-bundle'` gives `imageBundlePlugin` and `'fit'`
gives `fitPlugin`. The members are grouped in an interface the options extend:

```ts
export interface GraphPluginOptions {
  selectionCellsHandlerPlugin?: {
    edgeHandlerFactories?: Partial<Record<EdgeStyleHandlerKind, EdgeHandlerFactory>>;
  };
}

export interface GraphOptions extends GraphCollaboratorsOptions, GraphPluginOptions {
  container?: HTMLElement;
  plugins?: GraphPluginConstructor[];
}
```

```ts
new BaseGraph({
  container,
  plugins: [SelectionCellsHandler],
  selectionCellsHandlerPlugin: {
    edgeHandlerFactories: { segment: (state) => new EdgeSegmentHandler(state) },
  },
});
```

The `Plugin` suffix is not decoration. The options being flat, a bare `imageBundle: { … }` would sit next to
`plugins: [ … ]`, `model:` and `view:`, where it reads like a graph-level setting. `imageBundlePlugin: { … }` cannot be
misread, and it cannot collide with a collaborator option or with a future top-level option.

#### Option B: a single container gathering the plugin options

The member name is `camelCase(pluginId)`, with no suffix: the container already says these are plugin options, so
`imageBundle` rather than `imageBundlePlugin`.

```ts
export interface GraphOptions extends GraphCollaboratorsOptions {
  container?: HTMLElement;
  plugins?: GraphPluginConstructor[];
  pluginOptions?: GraphPluginOptions;
}

export interface GraphPluginOptions {
  selectionCellsHandler?: {
    edgeHandlerFactories?: Partial<Record<EdgeStyleHandlerKind, EdgeHandlerFactory>>;
  };
}
```

```ts
new BaseGraph({
  container,
  plugins: [SelectionCellsHandler],
  pluginOptions: {
    selectionCellsHandler: {
      edgeHandlerFactories: { segment: (state) => new EdgeSegmentHandler(state) },
    },
  },
});
```

The three-way split described in the context becomes visible in the type, instead of being an intersection the reader
has to know about.

#### Variant of option B: the plugin id used directly

`pluginOptions: { 'image-bundle': { … } }`, and `pluginOptions: { SelectionCellsHandler: { … } }` for a plugin not yet
renamed. The key is then literally the string passed to `getPlugin`, which helps discoverability and removes any naming
rule to learn or to document: dispatching the configuration is a plain lookup, and a custom plugin needs no convention
at all since its id is its id.

The counterpart is that a kebab-case key has to be quoted, and that the key inherits every id, including the legacy
ones, so renaming a plugin also breaks its option key.

#### What separates them

| | Option A | Option B | Variant of B |
|---|---|---|---|
| key | `camelCase(id) + 'Plugin'` | `camelCase(id)` | the id, verbatim |
| reads like a graph-level setting | no, the suffix marks it | no, the container marks it | no, the container marks it |
| quoting in user code | never | never | for every kebab-case id |
| dispatch in `onConfigure` | needs the id to key transformation | needs the id to key transformation | plain lookup |
| extra nesting | none | one level | one level |
| grouping in the IDE completion | mixed with the other options | one entry, then the plugins | one entry, then the plugins |

#### The consequence the two shapes share: legacy ids and target names

Eight of the ten builtin plugins still carry an id predating the current convention, `'SelectionCellsHandler'` and
`'PanningHandler'` against `'image-bundle'` and `'fit'`. They are going to be renamed, in their own dedicated change.

Since the key derives from the id, options A and B have to name it after the plugin's **target** name right away, so the
public key is published once and never changes while the id catches up later. The cost is that, until the renames
happen, the key is not mechanically derivable from the current id, `cellHandlerPlugin` against
`'SelectionCellsHandler'`, so dispatching needs a table for those eight plugins, deleted once they are renamed. This is
not urgent: the current forwarding is hardcoded for a single option, and the question only becomes real when
`onConfigure` lands.

The variant makes the opposite trade: nothing to name now, and a breaking change to the option key when the plugin is
renamed.

#### Part of the shape too: the options become interfaces, and custom plugins augment them

Whichever shape wins, the options have to be declared as interfaces rather than as the current type aliases, because
declaration merging applies to interfaces only. This is what lets a plugin published outside the core package declare
its own configuration:

```ts
declare module '@maxgraph/core' {
  interface GraphPluginOptions {
    myPlugin?: { threshold?: number };
  }
}
```

It is already the extension point of the library: `refactor(typescript): favor interface over type for object types`
(#1146) declared the object types with `interface`, added
`@typescript-eslint/consistent-type-definitions: ['error', 'interface']` to the lint configuration, and documented the
augmentation of `CellStateStyle` in the CHANGELOG, including its only behavior difference, an interface having no
implicit index signature.

`GraphPluginOptions` is the type third parties augment in every shape, so `GraphOptions` itself only has to become an
interface for option A, which extends it.

#### Still to settle

- Option A, option B, or the variant of B.
- The target name of `SelectionCellsHandler`, since `edgeHandlerFactories` belongs to it and its key is published in
  `0.25.0`. Candidates: `'cell-handler'` giving `cellHandlerPlugin` or `cellHandler`, or `'selection-cell-handler'`
  giving `selectionCellHandlerPlugin` or `selectionCellHandler`.
- Whether this ADR records the target name of every legacy plugin, or only the convention, leaving the table to the
  migration issue.
- An option is only honored when the plugin consuming it is registered, and its absence is a silent no-op, see _D1_.
  Whether to detect it, and then warn or throw, is part of this decision.

## Consequences

TODO. To be written with the decision.
