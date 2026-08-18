# ADR 0001: Use mixins to split the Graph class

- **Status**: Accepted. Not superseded: [ADR 0002](0002-use-plugins-for-optional-and-new-features.md) changes the
  approach used for new code, but this decision still explains most of the current codebase. See
  [Later evolution](#later-evolution)
- **Date**: documented retrospectively on 2026-08-10. The decision itself dates from commit `bc400a3ae` (2021-08-01),
  "Converted Graph\* classes into mixins"
- **Analysis basis**: commit `5c8cf90d8`, during the development of version 0.25.0. Any file or line reference below
  points to that commit
- **Scope**: `packages/core/src/view/mixin/`, `packages/core/src/view/AbstractGraph.ts`,
  `packages/core/src/internal/utils.ts`
  - **Related**: [discussion #18](https://github.com/maxGraph/maxGraph/discussions/18#discussioncomment-602917),
    [discussion #51](https://github.com/maxGraph/maxGraph/discussions/51),
    [discussion #151](https://github.com/maxGraph/maxGraph/discussions/151),
    [issue #762](https://github.com/maxGraph/maxGraph/issues/762), [ADR 0003](0003-move-members-out-of-abstract-graph.md),
    user documentation: [`plugins.md`](../../packages/website/docs/usage/plugins.md),
    [`migrate-from-mxgraph.md`](../../packages/website/docs/usage/migrate-from-mxgraph.md)

## Context

`maxGraph` inherits the design of `mxGraph`, whose `mxGraph` class is a
[God Object](https://en.wikipedia.org/wiki/God_object): in v4.2.2, `mxGraph.js` is
[13229 lines](https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/src/js/view/mxGraph.js#L13229) holding cell
editing, selection, validation, folding, panning, zooming, overlays, swimlanes and more.

Splitting that class was a prerequisite for the modernisation goals of `maxGraph`: making the codebase navigable,
making the API describable in TypeScript, and eventually making the library tree-shakeable.

The obvious approach, extracting collaborator classes and delegating to them, breaks every existing call site.
`graph.isCellSelectable(cell)` would become `graph.selection.isCellSelectable(cell)`, across an API surface of several
hundred methods, for a library whose main selling point at the time was being a drop-in successor to `mxGraph`.

## Decision

Split the `Graph` class into **mixins**: plain objects whose members are copied onto the `AbstractGraph` prototype at
import time, and whose types are merged into the `AbstractGraph` interface through TypeScript declaration merging.

The call sites do not change. `graph.isCellSelectable(cell)` keeps working, and keeps type-checking, while the
implementation lives in `SelectionMixin`.

### Structure

Each mixin is a pair of files in `packages/core/src/view/mixin/`:

| File | Holds |
|---|---|
| `XxxMixin.ts` | the implementation, as an object literal |
| `XxxMixin.type.ts` | the type declarations **and the TSDoc**, via `declare module '../AbstractGraph'` |

The implementation file declares what it needs and what it provides, as two `Pick` types:

```typescript
type PartialGraph = Pick<AbstractGraph, 'getView' | 'getGraphBounds' | 'getPageFormat'>;   // dependencies
type PartialPageBreaks = Pick<AbstractGraph, 'horizontalPageBreaks' | 'updatePageBreaks'>; // own members
type PartialType = PartialGraph & PartialPageBreaks;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const PageBreaksMixin: PartialType = { ... };
```

This is more than a typing trick: the `PartialGraph` list is an explicit, compiler-checked declaration of everything the
mixin reads from the rest of the graph. It is the closest thing the codebase has to a dependency graph between concerns.

### Registration

- `_graph-mixins-apply.ts` exports `applyGraphMixins(target)`, which applies every mixin through `mixInto`.
- `AbstractGraph.ts` calls it at module scope, as a deliberate import-time side effect, so the class definition is
  always complete whichever entry point is used.
- `_graph-mixins-types.ts` imports every `.type.ts` file, and `src/index.ts` imports it, so the augmentations are always
  in scope for consumers.

### Rules

- **No mixin is exported outside its directory.** They are an implementation detail, not part of the public API.
- Every mixin must be registered in both `_graph-mixins-apply.ts` and `_graph-mixins-types.ts`.
- The TSDoc lives in the `.type.ts` file, next to the declaration, not next to the implementation.

### Implementation

`mixInto` (`packages/core/src/internal/utils.ts:63`) walks `Reflect.ownKeys(mixin)` and calls
`Object.defineProperty(dest.prototype, key, { value, writable: true })`. It is marked `@private`, not part of the public
API.

## Consequences

### Positive

- The God object is split by concern, one mixin per concern, each independently readable.
- **The public API is unchanged**, and stays unchanged when a member moves between the class and a mixin, or between two
  mixins. Declaration merging keeps every member on the `AbstractGraph` interface wherever it is declared. This property
  is what makes the incremental cleanup of [ADR 0003](0003-move-members-out-of-abstract-graph.md) possible at zero cost
  to users.
- Each mixin's `PartialGraph` list documents its coupling to the rest of the graph, and the compiler enforces it.

The strongest evidence that the API was preserved is negative: the word "mixin" does not appear once in
[`migrate-from-mxgraph.md`](../../packages/website/docs/usage/migrate-from-mxgraph.md), the guide that documents every
user-visible difference with `mxGraph`. Splitting the God object into mixins cost users nothing. By contrast the
same guide devotes a section and a seven-row table to the handler-to-plugin conversion, because that one did break call
sites. The two approaches sit at opposite ends of the same trade-off, and
[ADR 0002](0002-use-plugins-for-optional-and-new-features.md) explains why the more expensive one was still the right
next step.

### Negative

These are the reasons the direction later shifted to plugins. They are consequences of the approach itself, not defects
of a particular mixin.

- **Mutable defaults become shared state.** Members are installed on the prototype, so an object or array default is
  shared by every graph instance: mutating it on one graph mutates it for all of them. This is documented on `mixInto`
  itself, which states that the limitation will not be fixed because the plan is to move mixin code to plugins. The
  workaround in place is a dedicated block in `AbstractGraph` ("Variables that should be in the mixins but requiring
  per-instance initialization") holding the properties that cannot move. The failure mode is silent: no compile error,
  and no failing test unless one is written for it.
- **No tree-shaking.** Every mixin is imported and applied unconditionally, whatever the graph flavour. A consumer
  using none of the swimlane API still ships `SwimlaneMixin`. This directly contradicts one of the goals that motivated
  the split.
- **Serialization asymmetry.** `Object.defineProperty` leaves `enumerable` at `false`, so members installed by a mixin
  are not enumerable on the prototype, while class field initializers create own enumerable properties on each instance.
  The consequence, recorded in a comment inside `mixInto`, is that properties coming from mixins are not serialized when
  exporting a graph with Codecs, whereas properties defined directly on the class are.
- **Two files per concern.** Documentation and implementation are separated, so reading a member means opening the
  `.type.ts` for the contract and the `.ts` for the behaviour.
- **Indirect navigation.** The `AbstractGraph` interface is assembled from the class plus one `.type.ts` file per
  mixin. A reader looking for a method has no single declaration site to jump to.

## Later evolution

The shortcomings above led to a change of direction: mixin code is to be moved to per-instance **plugins**, tracked by
[issue #762](https://github.com/maxGraph/maxGraph/issues/762). `ImageMixin` has already become `ImageBundlePlugin`.
Plugins are instantiated per graph, which removes the shared-state problem outright, and are opt-in, which restores
tree-shaking, at the price of a breaking change for `BaseGraph` users.

That direction is the subject of [ADR 0002](0002-use-plugins-for-optional-and-new-features.md). Until every mixin is
converted, mixins remain a structure in place, and [ADR 0003](0003-move-members-out-of-abstract-graph.md) uses existing
mixins as interim, non-breaking destinations for members still sitting in `AbstractGraph`.

This ADR is not reversed: it records why mixins were chosen and what they cost, which stays relevant for as long as any
mixin remains.
