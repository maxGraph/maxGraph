# TODO

Follow-up items found while reviewing the `refactor/762-edgeHandler_factory_move_out_of_AbstractGraph` branch, which
moved the cell handler factories out of `AbstractGraph` into the `SelectionCellsHandler` plugin
(see [issue #762](https://github.com/maxGraph/maxGraph/issues/762)).

None of these block the branch: they were deliberately left out of its scope.

## API gaps

### No way to decorate the default handler

**Decision: keep the current code. Candidate for a later feature, not something to fix in this branch.**

`setEdgeHandlerFactory(handlerKind, factory)` and `setEdgeHandlerFactoryForAllKinds(factory)` both *replace* the
handler. Neither expresses "take whatever the default would have built, then tweak it".

`packages/html/stories/DragSource.stories.ts:117` and `packages/html/stories/Orthogonal.stories.ts:95` need exactly
that: they set `snapToTerminals = true` on the handler the default logic returned. Both keep monkey-patching
`selectionCellsHandler.createEdgeHandler`, which stays valid, since expressing it with the setters would mean
re-implementing the `EdgeStyleRegistry` kind lookup in user code just to rebuild the instance to tweak.

If it is picked up later, the options are a decorator hook invoked after the factory, or exposing the resolved kind
so user code can delegate back to the built-in factory. The two stories would then be migrated off the
monkey-patch.

### `getConnectionConstraint` return type

`packages/html/stories/PortRefs.stories.ts:245` carries a `TODO` noting that `getConnectionConstraint` is typed as
returning a non-nullable value while every caller already null-checks the result. The story works around it with
`return null!`. The signature should be widened to declare the nullable return.

## Tree-shaking

The `edgeHandlerFactories` map in `packages/core/src/view/plugin/SelectionCellsHandler.ts` statically references
`EdgeHandler`, `ElbowEdgeHandler` and `EdgeSegmentHandler`, so any application registering `SelectionCellsHandler`
bundles all three even when it only ever draws straight edges.

Tracked by [issue #890](https://github.com/maxGraph/maxGraph/issues/890), whose description carries the exact code to
change, the verified import graph and the bundle baseline measured on this branch.
