# [FEAT] Configure plugins at graph construction time

<!-- Content for a GitHub issue, following .github/ISSUE_TEMPLATE/02-feature-request.md. Not created on GitHub yet. -->

> [!NOTE]
> This description applies to version 0.24.0, the release available when this issue was created, and assumes that #890 is implemented before the work described here.

### Is your feature request related to a problem? Please describe.

A plugin can only be configured once the graph is built. `GraphPlugin` declares `onDestroy` and nothing else, so the graph never hands anything to a plugin. An application has to fetch the instance and mutate it:

```ts
const graph = new BaseGraph({ container, plugins: [RubberBandHandler] });
graph.getPlugin<RubberBandHandler>('RubberBandHandler')!.fadeOut = true;
```

Three consequences:

- **it can be too late.** Anything the plugin reads during the first render or the first selection has already been read with its default value.
- **the application has to know internals**: the plugin id as a string, the class for the generic parameter, and the mutable property names. A typo in the id yields `undefined`, so the line above becomes a silent no-op or a runtime error, depending on the non-null assertion.
- **nothing is discoverable.** The graph options are the documented entry point of the library, and they say nothing about what the registered plugins accept.

**#890 turns this into a blocker.** Letting an application declare which `EdgeHandler` subclass handles which edge style kind requires the factories to be known before the first selection, that is while the graph is being built. Nothing in the plugin API allows it, so the implementation has to add a graph option and forward it from `AbstractGraph` itself, in a block placed after the plugins are instantiated and before `view.revalidate()`, calling a setter on `SelectionCellsHandler`.

That forwarding is the only thing available today, and it costs:

- `AbstractGraph` hardcodes the plugin id `'SelectionCellsHandler'` and the setter it calls, so the graph knows about one specific plugin, which is exactly what the plugin architecture is meant to avoid;
- it adds **0.23 kB** to every application, including one that registers no plugin at all, measured on `ts-example-without-defaults`;
- it does not scale: one option to forward means one more method on `AbstractGraph`.

**The rubber band plugin shows the same need, without the blocker.** `RubberBandHandler` exposes `fadeOut` and `defaultOpacity` as mutable properties, and more options are wanted for it. Nothing forces them to be set during construction, yet declaring them there is what an application actually wants: it is simpler and more readable to name the plugin and its configuration in the same place than to fetch the instance afterwards, repeat the id as a string and assert it is not `undefined`.

Third-party plugins get nothing at all. The options type is closed, so a plugin published on npm cannot add its own configuration to the graph options, even though `PluginId` accepts any string and custom plugins are a documented feature, see `packages/website/docs/usage/plugins.md`, section _Creating a Custom Plugin_.

### Describe the solution you'd like

**1. The graph options carry the plugin configuration, and become extensible.**

`GraphOptions` is currently a type alias intersecting an object literal with `GraphCollaboratorsOptions`. Declare it as an interface instead, which is the rule enforced since #1146 and which makes it augmentable:

```ts
export interface GraphOptions extends GraphCollaboratorsOptions {
  container?: HTMLElement;
  plugins?: GraphPluginConstructor[];
}
```

Where the plugin configuration goes has two candidate shapes, and **this issue does not decide between them**.

_Option A, one member per plugin, at the top level of the graph options._ The member name is `camelCase(pluginId)` suffixed by `Plugin`, and the members are grouped in an interface the options extend:

```ts
export interface GraphPluginOptions {
  rubberBandPlugin?: { fadeOut?: boolean; defaultOpacity?: number };
}

export interface GraphOptions extends GraphCollaboratorsOptions, GraphPluginOptions {
  container?: HTMLElement;
  plugins?: GraphPluginConstructor[];
}
```

```ts
new BaseGraph({
  container,
  plugins: [RubberBandHandler],
  rubberBandPlugin: { fadeOut: true },
});
```

The `Plugin` suffix is not decoration. The options being flat, a bare `rubberBand: { … }` would sit next to `plugins: [ … ]`, `model:` and `view:`, where it reads like a graph-level setting.

_Option B, a single container keyed by plugin ids._

```ts
export interface GraphOptions extends GraphCollaboratorsOptions {
  container?: HTMLElement;
  plugins?: GraphPluginConstructor[];
  pluginOptions?: GraphPluginOptions;
}

export interface GraphPluginOptions {
  'rubber-band'?: { fadeOut?: boolean; defaultOpacity?: number };
}
```

```ts
new BaseGraph({
  container,
  plugins: [RubberBandHandler],
  pluginOptions: { 'rubber-band': { fadeOut: true } },
});
```

In both shapes the key derives from the **plugin id**, never from the class name: the id is the runtime identity, the one `getPlugin` takes, and the only thing a custom plugin is guaranteed to expose. The class name happens to coincide, since the convention already forces `class = PascalCase(id) + 'Plugin'`.

What separates the two:

| | Option A | Option B |
|---|---|---|
| key | `camelCase(id) + 'Plugin'` | the id, verbatim |
| dispatch to the owning plugin | needs the id to key transformation | plain lookup |
| legacy plugin ids in user code | avoidable, see below | exposed as is, `'SelectionCellsHandler'` |
| extra nesting | none | one level |

The legacy ids are what makes this a real choice rather than a matter of taste. Eight of the ten builtin plugins carry an id predating the current naming convention, `'SelectionCellsHandler'` and `'PanningHandler'` against `'image-bundle'` and `'fit'`, and they are going to be renamed in a dedicated change. Option A can name the member after the plugin's **target** name right away, so the public key is published once and never changes, while the id catches up later. Option B locks the current id into the public API, and the rename then breaks the option key too.

**2. A new optional `onConfigure` lifecycle hook on `GraphPlugin`.**

Optional, so every existing plugin and every plugin published outside this repository keeps compiling and keeps working:

```ts
export interface GraphPlugin {
  onDestroy: () => void;
  onConfigure?: (options: GraphPluginOptions) => void;
}
```

`AbstractGraph` calls it for each registered plugin, after every plugin is instantiated, so a plugin may reach a sibling, and before `view.revalidate()`, so the configuration applies to the first render and the first selection.

The iteration starts from the plugins that were actually registered, and each one pulls the configuration it understands. A configuration entry for a plugin that is not registered is therefore **a silent no-op**, and it is undetectable by construction: detecting it would need a mapping from option key to owning plugin, which cannot exist for a custom plugin whose package is not even installed. That behavior matches the existing precedent, `AbstractGraph.setTooltips` no-ops through `?.` when `TooltipHandler` is absent. Whether the chosen shape makes detection possible after all, and whether to then warn, is part of the decision.

**3. Custom plugins extend the options through TypeScript module augmentation.**

A plugin published outside the core package declares its own configuration:

```ts
declare module '@maxgraph/core' {
  interface GraphPluginOptions {
    myPlugin?: { threshold?: number };
  }
}
```

This is already the extension point of the library: #1146 declared the object types with `interface`, added `@typescript-eslint/consistent-type-definitions: ['error', 'interface']` to the lint configuration, and documented the augmentation of `CellStateStyle` in the CHANGELOG. Declaring the options as interfaces is what carries it over to them.

**4. The forwarding added by #890 goes away.**

Once the hook exists, the block forwarding the edge handler factories is deleted from `AbstractGraph`, and `SelectionCellsHandler` reads its own configuration from `onConfigure`. The 0.23 kB it costs moves into the plugin, so an application registering no plugin stops paying for it.

### Describe alternatives you've considered

- **Keep configuring plugins after construction, through `getPlugin`.** The status quo. Too late for anything read during the first render, and it forces the application to know plugin ids and property names.
- **Keep adding one forwarding method per option on `AbstractGraph`**, which is what #890 has to do for lack of anything better. It does not scale, it puts plugin knowledge back into the graph, and every application pays the code size whether it registers the plugin or not.
- **Pass the options next to the plugin in the `plugins` array**, for instance `plugins: [FitPlugin, [ImageBundlePlugin, { … }]]`. It pairs a plugin with its configuration at the call site, needs no augmentable global type, and makes an option for an unregistered plugin impossible to express. But it changes the shape of `plugins`, which is released API, and it makes the common case, no configuration, noisier.
- **An index signature on the options type** instead of module augmentation. Open to any plugin with no work, but untyped: no completion, and a typo in a key is silently accepted.
- **A generic type parameter on `GraphOptions`.** Type safe and explicit, but viral: it propagates into every signature mentioning the options, for a benefit only custom plugins get.

### Tasks

- [ ] Write an ADR recording the decision: the shape of the plugin options, the rule deriving the key from the plugin id, and what happens when an option targets a plugin that is not registered.
- [ ] Declare `GraphOptions` as an interface extending `GraphCollaboratorsOptions`, and add the chosen plugin options shape.
- [ ] Add the optional `onConfigure` hook to `GraphPlugin`, and call it from `AbstractGraph` for each registered plugin, after every plugin exists and before the first render.
- [ ] Move the edge handler factories handling introduced by #890 into `SelectionCellsHandler.onConfigure`, and delete the forwarding block from `AbstractGraph`.
- [ ] Configure `RubberBandHandler` from the options, as a second consumer. It validates the mechanism on a plugin that is not part of the default set.
- [ ] Tests in `packages/core/__tests__/view/plugin/`: the hook is called once per registered plugin, after every plugin exists and before the first render; a plugin without the hook is a no-op; an option targeting an unregistered plugin changes nothing and throws nothing; the edge handler factories keep behaving exactly as before through the new path.
- [ ] Add a module augmentation sample to `packages/ts-support`, so the extension point is checked against the minimum supported TypeScript version. Do not augment inside the tests of `packages/core`: #1146 records that an augmentation applies to the whole TypeScript program, so the custom members would leak into every other test of the package and silently weaken them.
- [ ] Update `packages/website/docs/usage/plugins.md`: how a plugin is configured from the graph options, and how a custom plugin declares its own options in the _Creating a Custom Plugin_ section.
- [ ] Update `packages/website/docs/usage/cell-handlers.md` where it documents the edge handler factories option, if its public shape changes.
- [ ] Run `./scripts/build-all-examples.bash` and report the sizes, the expectation being that `ts-example-without-defaults` loses the 0.23 kB of forwarding code.

### Additional context

- #890 introduces the first construction-time configuration of a plugin, hardcoded in `AbstractGraph` for lack of a generic mechanism. This issue generalizes it and removes that code.
- #1146 already made module augmentation the extension point of the package, with a `CellStateStyle` example in the CHANGELOG. It also documents the only behavior difference of interfaces, no implicit index signature, so a value is no longer implicitly assignable to `Record<string, unknown>`.
- Eight of the ten builtin plugins still carry an id predating the current naming convention. Renaming them is a separate change and needs its own issue, but the option keys depend on the target names.
- Suggested labels: `enhancement` and `triage`, the defaults of the feature request template.
