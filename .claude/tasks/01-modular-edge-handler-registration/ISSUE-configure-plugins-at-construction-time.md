# [FEAT] Configure plugins at graph construction time

<!-- Content for a GitHub issue, following .github/ISSUE_TEMPLATE/02-feature-request.md. Not created on GitHub yet. -->

### Is your feature request related to a problem? Please describe.

A plugin cannot be configured while the graph is being built. `GraphPlugin` declares `onDestroy` and nothing else (`packages/core/src/types.ts:1257-1260`), so the only way for an application to configure a plugin is to fetch it after construction and mutate it:

```ts
const graph = new BaseGraph({ container, plugins: [RubberBandHandler] });
graph.getPlugin<RubberBandHandler>('RubberBandHandler')!.fadeOut = true;
```

Three consequences:

- **it can be too late.** Anything consumed during the first render or the first selection has already been read with its default value. This is exactly why `edgeHandlerFactories` could not be left to the application, see below.
- **the application has to know internals**: the plugin id, the class for the generic parameter, and the mutable property names. A typo in the id yields `undefined` and a silent no-op.
- **nothing is discoverable.** The graph options are the documented entry point of the library, and they say nothing about what the registered plugins can be told.

Version 0.25.0 (unreleased) introduced one exception, and it shows what a general mechanism has to replace. `GraphPluginOptions` holds a single member, `edgeHandlerFactories`, forwarded by `AbstractGraph.configureEdgeHandlerFactories` (`packages/core/src/view/AbstractGraph.ts:473-482`), called between the plugin instantiation loop (`:458`) and `this.view.revalidate()` (`:462`). It works, and the doc comment of the method already says it is meant to be replaced by a lifecycle hook. Its cost:

- `AbstractGraph` hardcodes the id `'SelectionCellsHandler'` and one property name, so the graph knows about a specific plugin. That is precisely what the plugin architecture moves away from, see ADR 0002 (`docs/adr/0002-use-plugins-for-optional-and-new-features.md`, pending).
- the forwarding code adds **0.23 kB** to every application, including one that registers no plugin at all, measured on `ts-example-without-defaults`.
- it does not scale: one option means one more method on `AbstractGraph`.

Third-party plugins get nothing at all. `GraphPluginOptions` is a closed type in the core package, so a plugin published on npm cannot add its own configuration to `GraphOptions`, even though `PluginId` accepts any string and custom plugins are a documented feature (`packages/website/docs/usage/plugins.md`, section _Creating a Custom Plugin_).

### Describe the solution you'd like

**1. Plugin configuration is part of `GraphOptions`.**

The group already exists, `GraphPluginOptions`, and it is the third member of `GraphOptions` alongside what the graph is built from (`container`, `plugins`) and what it delegates to its collaborators (`GraphCollaboratorsOptions`). Each member is consumed by a distinct phase of the constructor.

Two candidate shapes are on the table, and **this issue does not decide between them**. They are recorded in the draft ADR `docs/adr/0004-configure-plugins-from-the-graph-options.md`, which is where the decision belongs:

- one key per plugin at the top level of the graph options, named `camelCase(pluginId)` suffixed by `Plugin`, so `'image-bundle'` gives `imageBundlePlugin`;
- a single `pluginOptions` container keyed by plugin ids, verbatim.

In both shapes the key derives from the **plugin id**, never from the class name: the id is the runtime identity, and it is the only thing a custom plugin is guaranteed to expose.

**2. A new optional `onConfigure` lifecycle hook on `GraphPlugin`.**

Optional, so every existing plugin and every plugin published outside this repository keeps compiling and keeps working:

```ts
export interface GraphPlugin {
  onDestroy: () => void;
  onConfigure?: (options: GraphPluginOptions) => void;
}
```

`AbstractGraph` calls it for each registered plugin, at the exact point where `configureEdgeHandlerFactories` is called today: after every plugin is instantiated, so a plugin may reach a sibling, and before `view.revalidate()`, so the configuration applies to the first render and the first selection.

The iteration starts from the plugins that were actually registered, and each one pulls the configuration it understands. A configuration entry for a plugin that is not registered is therefore **a silent no-op**, undetectable by construction. This is the current documented behavior and the rationale is recorded in the `#890` plan, decision _D2_: detecting it would need a mapping from configuration key to owning plugin, which cannot exist for a custom plugin whose package is not even installed. Whether the chosen shape makes detection possible after all, and whether to warn, is part of ADR 0004.

**3. Custom plugins extend the options through TypeScript module augmentation.**

A plugin published outside the core package declares its own configuration:

```ts
declare module '@maxgraph/core' {
  interface GraphPluginOptions {
    myPlugin?: { threshold?: number };
  }
}
```

**Already unlocked on `main`**: `refactor(typescript): favor interface over type for object types` (#1146) declared the object types of the package with `interface` and added `@typescript-eslint/consistent-type-definitions: ['error', 'interface']` to the lint configuration. Module augmentation is therefore already the documented extension point of the library, for `CellStateStyle` and `CellStyle`, and `GraphCollaboratorsOptions` is already an interface.

Two points remain:

- `GraphPluginOptions` was written as a type alias before that change landed, so it has to be declared as an interface. The lint rule requires it anyway, since it is a plain object type.
- `GraphOptions` stays a `type`, because it is an intersection (`{ container, plugins } & GraphCollaboratorsOptions & GraphPluginOptions`), which the lint rule does not flag. It does not need to change: augmenting the `GraphPluginOptions` interface is enough, its new members flow into the intersection. That holds for both candidate shapes, so no conversion of `GraphOptions` is required by this feature.

The one behavior difference of interfaces, no implicit index signature so a value is no longer implicitly assignable to `Record<string, unknown>`, is already documented in `CHANGELOG.md` under `## Unreleased`. Nothing to re-investigate.

**4. The hardcoded forwarding goes away.**

Once the hook exists, `AbstractGraph.configureEdgeHandlerFactories` is deleted and `SelectionCellsHandler` reads `edgeHandlerFactories` from its own `onConfigure`. The method was deliberately kept as a single isolated private block to make this extraction trivial. The 0.23 kB it costs today moves into the plugin, so an application registering no plugin stops paying for it.

### Describe alternatives you've considered

- **Keep configuring plugins after construction, through `getPlugin`.** The status quo. Too late for anything read during the first render, and it forces the application to know plugin ids and property names.
- **Keep adding one forwarding method per option on `AbstractGraph`.** What `edgeHandlerFactories` does today. It does not scale, it puts plugin knowledge back into the graph, and every application pays the code size whether it registers the plugin or not.
- **Pass the options next to the plugin in the `plugins` array**, for instance `plugins: [FitPlugin, [ImageBundlePlugin, { ... }]]`. Pairs a plugin with its configuration at the call site, needs no augmentable global type, and makes an option for an unregistered plugin impossible to express. But it changes the shape of `plugins`, which is released API, and it makes the common case (no configuration) noisier.
- **An index signature on the options type** instead of module augmentation. Open to any plugin with no work, but untyped: no completion, and a typo in a key is silently accepted.
- **A generic type parameter on `GraphOptions`**. Type safe and explicit, but viral: it propagates into every signature that mentions the options, for a benefit only custom plugins get.

### Tasks

- [ ] Settle and complete ADR `docs/adr/0004-configure-plugins-from-the-graph-options.md`. The draft exists and states the open points: the shape, the target name of `SelectionCellsHandler` (its key is published in 0.25.0), whether a configuration for an unregistered plugin is detected, and the `onConfigure` section itself, which is a placeholder.
- [ ] Declare `GraphPluginOptions` as an interface, which the lint rule added by #1146 requires anyway, so that a custom plugin can augment it. `GraphOptions` itself stays an intersection and needs no change.
- [ ] Add the optional `onConfigure` hook to `GraphPlugin` and call it from `AbstractGraph`, at the place where `configureEdgeHandlerFactories` is called today.
- [ ] Move the `edgeHandlerFactories` handling into `SelectionCellsHandler.onConfigure` and delete `AbstractGraph.configureEdgeHandlerFactories`.
- [ ] Tests in `packages/core/__tests__/view/plugin/`: the hook is called once per registered plugin, after every plugin exists and before the first render; a plugin without the hook is a no-op; a configuration entry for an unregistered plugin changes nothing and throws nothing; `edgeHandlerFactories` keeps behaving exactly as before through the new path.
- [ ] Add a module augmentation sample to `packages/ts-support`, so the extension point is checked against the minimum supported TypeScript version. Do not augment inside the tests of `packages/core`: #1146 records that an augmentation applies to the whole TypeScript program, so the custom members would leak into every other test of the package and silently weaken them.
- [ ] Update `packages/website/docs/usage/plugins.md`: how a plugin is configured from the graph options, and how a custom plugin declares its own options in the _Creating a Custom Plugin_ section.
- [ ] Update `packages/website/docs/usage/cell-handlers.md` where it documents `edgeHandlerFactories`, if the public shape of the option changes.
- [ ] Run `./scripts/build-all-examples.bash` and report the sizes, the expectation being that `ts-example-without-defaults` loses the 0.23 kB of forwarding code.

### Additional context

- Draft ADR: `docs/adr/0004-configure-plugins-from-the-graph-options.md`.
- The mechanism this generalizes was introduced by #890, whose plan records the decisions it depends on: the silent no-op (_D2_) and the reason the forwarding sits between the plugin loop and `view.revalidate()`.
- Eight of the ten builtin plugins still carry an id predating the current naming convention (`'SelectionCellsHandler'`, `'PanningHandler'`, against `'image-bundle'` and `'fit'`). The option keys depend on that renaming, which is a separate change and needs its own issue.
- Suggested labels, checked against the repository label list: `enhancement`, `triage` (both are the defaults of the feature request template). Note that neither `breaking change` nor `typescript` exists in this repository.
