# ADR 0004: Configure plugins from the graph options

- **Status**: Proposed. Nothing below is settled, two candidate shapes are on the table
- **Date**: 2026-08-20
- **Deadline**: before `0.25.0` ships. `GraphPluginOptions` and its only member are unreleased, so the shape can still
  change for free. Once released, every change to it breaks applications
- **Scope**: `packages/core/src/types.ts` (`GraphOptions`, `GraphCollaboratorsOptions`, `GraphPluginOptions`,
  `GraphPlugin`), `packages/core/src/view/AbstractGraph.ts`, `packages/core/src/view/plugin/`
- **Analysis basis**: commit `cd8701bc1`, during the development of version 0.25.0. Any file or line reference below
  points to that commit
- **Related**: [ADR 0002](0002-use-plugins-for-optional-and-new-features.md),
  [issue #890](https://github.com/maxGraph/maxGraph/issues/890), user documentation:
  [`plugins.md`](../../packages/website/docs/usage/plugins.md),
  [`cell-handlers.md`](../../packages/website/docs/usage/cell-handlers.md)

## Context

`GraphOptions` is the single parameter of the `AbstractGraph` constructor. It is a flat intersection of three groups,
and each group exists because a distinct phase of the constructor consumes it:

- what the graph is built from: `container` and `plugins`;
- what it delegates to its collaborators: `GraphCollaboratorsOptions`, which carries `model`, `view`, `stylesheet`,
  `cellRenderer` and `selectionModel`;
- what it hands over to its plugins: `GraphPluginOptions`.

The third group is new. It was extracted while making the edge handler registration modular, and it holds exactly one
member today, `edgeHandlerFactories`, sitting flat at its top level. That member is consumed by a single plugin,
`SelectionCellsHandler`, and the graph forwards it to that plugin with a hardcoded private method.

Two groups make a convention, and every option added from now on will follow the shape of this one by imitation. The
question this ADR has to answer is therefore not "where does `edgeHandlerFactories` go", but "how is any plugin
configured from the graph options, for the next years".

A related question comes with it, and cannot be separated from it: the graph forwards that option by name, in code it
owns, which means `AbstractGraph` knows about a specific plugin. That is exactly what
[ADR 0002](0002-use-plugins-for-optional-and-new-features.md) moves away from. The `onConfigure` lifecycle hook is what
removes that knowledge, and the shape chosen below decides how the hook dispatches. Both are decided here.

## Decision

**Open.** Two candidate shapes, neither retained yet.

### The rule both options share

The key identifying a group of options derives from the **plugin id**, in kebab-case, not from the plugin class name:

- the id is the runtime identity, the one `getPlugin('fit')` takes, and the only thing a custom plugin is guaranteed to
  expose;
- a custom plugin is free to name its class anything, so a rule based on the class name would not apply to it;
- the class name happens to coincide anyway, since the naming convention already forces
  `class = PascalCase(id) + 'Plugin'`. That coincidence is a mnemonic, not the rule.

### Option A: one key per plugin, at the top level of the graph options

The key is `camelCase(pluginId)` suffixed by `Plugin`. `'image-bundle'` gives `imageBundlePlugin`, `'fit'` gives
`fitPlugin`.

```ts
new BaseGraph({
  container,
  plugins: [FitPlugin, ImageBundlePlugin],
  fitPlugin: { /* … */ },
  imageBundlePlugin: { /* … */ },
});
```

The `Plugin` suffix is not decoration. `GraphOptions` being a flat intersection, a bare `fit: { … }` would sit next to
`plugins: [ … ]`, `model:` and `view:`, where it reads like a graph-level setting. `fitPlugin: { … }` cannot be
misread, and it cannot collide with a collaborator option or with a future top-level option.

### Option B: a single container keyed by plugin ids

The keys are the plugin ids, verbatim, inside one `pluginOptions` member.

```ts
new BaseGraph({
  container,
  plugins: [FitPlugin, ImageBundlePlugin],
  pluginOptions: {
    fit: { /* … */ },
    'image-bundle': { /* … */ },
  },
});
```

No transformation, no suffix, and the three-way split described in the context becomes visible in the type instead of
being an intersection the reader has to know about. Dispatching configuration to a plugin is a plain lookup by id,
which works for custom plugins with no rule at all.

### What separates them

| | Option A | Option B |
|---|---|---|
| key | `camelCase(id) + 'Plugin'` | the id, verbatim |
| ambiguity with the other graph options | none, the suffix marks it | none, the container marks it |
| dispatch in `onConfigure` | needs the id to key transformation | plain lookup |
| legacy plugin ids in user code | avoidable, see below | exposed as is, `'SelectionCellsHandler'` |
| extra nesting | none | one level |

The legacy ids are what makes this a real choice rather than a matter of taste. Eight of the ten builtin plugins still
carry an id predating the current convention, `'SelectionCellsHandler'` and `'PanningHandler'` against `'image-bundle'`
and `'fit'`. They are going to be renamed, in their own dedicated change.

Option A can name the key after the plugin's **target** name today, so the option key is published once and never
changes again, while the id catches up later. Option B locks the current id into the public API, and the rename then
breaks the option key too.

The cost of naming keys after target names is that, until the renames happen, the key is not derivable from the current
id: `cellHandlerPlugin` against `'SelectionCellsHandler'`. A generic dispatch would then need either the renames done
first, or a small internal table for the eight legacy plugins, deleted once they are renamed. This is not urgent: the
current forwarding is hardcoded for a single option, and the question only becomes real when `onConfigure` lands.

### Still to settle

- Option A or option B.
- The target name of `SelectionCellsHandler`, since `edgeHandlerFactories` belongs to it and its key is published in
  `0.25.0`. Candidates: `'cell-handler'` giving `cellHandlerPlugin`, or `'selection-cell-handler'` giving
  `selectionCellHandlerPlugin`.
- Whether this ADR records the target name of every legacy plugin, or only the convention, leaving the table to the
  migration issue.
- An option is only honored when the plugin consuming it is registered, and its absence is a silent no-op today. Both
  options above make detection possible. Whether to detect, and then warn or throw, is part of this decision.

## The `onConfigure` plugin lifecycle hook

TODO. Placeholder, to be written once the shape above is chosen, since the shape decides how the hook receives and
dispatches the configuration.

What this section has to cover:

- why the hook exists: `GraphPlugin` declares `onDestroy` only, so a plugin has no way to receive configuration after
  the graph built it. The graph therefore forwards options itself, by name, and knows about a specific plugin;
- what it replaces: the hardcoded forwarding of `edgeHandlerFactories` in `AbstractGraph`, deliberately isolated in a
  single private method to make the extraction trivial;
- the signature, and where it is called in the constructor sequence, after the plugins exist and before the first
  render;
- the side benefit, measured: the forwarding costs 0.23 kB to every application, including one registering no plugin at
  all. The hook moves that cost into the plugin that needs it;
- what a plugin is allowed to do from the hook, and what it must not do.

## Consequences

TODO. To be written with the decision.
