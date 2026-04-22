# Task: Remove `ImageMixin` and move `imageBundles` storage to the plugin

## Problem

With `CellsMixin.postProcessCellStyle` now routed through `getPlugin()` (Task 4), the graph's three legacy methods (`addImageBundle`, `removeImageBundle`, `getImageFromBundles`) and the `imageBundles` field on `AbstractGraph` are the only things keeping the old API alive. Removing them is the atomic breaking change of this migration: by the end of this task, `graph.imageBundles`, `graph.addImageBundle(...)`, etc. no longer exist; the plugin is the single owner of bundle state and behavior.

## Proposed Solution

All changes in this task MUST land in the same commit (along with Tasks 3, 4, 6, 7, 8) because they produce a coordinated breaking change. Splitting would leave the tree uncompilable at intermediate points.

Edits in this task:

- Delete `packages/core/src/view/mixin/ImageMixin.ts` and `packages/core/src/view/mixin/ImageMixin.type.ts`.
- In `packages/core/src/view/mixin/_graph-mixins-apply.ts`: remove the `ImageMixin` import and its entry in the `mixInto` loop array.
- In `packages/core/src/view/mixin/_graph-mixins-types.ts`: remove the `import './ImageMixin.type.js';` line.
- In `packages/core/src/view/AbstractGraph.ts`: remove the `imageBundles: ImageBundle[] = [];` field at line 107. If removing it leaves the `ImageBundle` import in that file unused, remove the import too (verify with a grep across the file).
- In `packages/core/__tests__/view/BaseGraph.test.ts`: delete the `test('imageBundles', …)` block that asserts per-instance isolation via `graph1.imageBundles.push(…)` — the field no longer exists on `BaseGraph`. If the `ImageBundle` import at the top becomes unused after the deletion, remove it. Equivalent isolation coverage is added in Task 6 at the plugin level.
- In `packages/core/__tests__/serialization/codec/all-graph-classes.test.ts`: remove the `<Array as="imageBundles" />` line from the XML template in `buildXml()`. The codec seed instance no longer has that field, so the serialized form no longer includes it.

After these edits, the plugin's own `imageBundles: ImageBundle[] = []` (Task 2) is the sole storage. `Graph` instances keep working because the plugin is in `getDefaultPlugins()` (Task 3). `BaseGraph` instances lose bundle support by default — users must add `ImageBundlePlugin` explicitly, which is documented in the CHANGELOG (Task 8).

## Dependencies

- Task 2 (plugin class must exist to own the storage).
- Task 3 (plugin must be registered so `Graph` users keep working).
- Task 4 (`CellsMixin.postProcessCellStyle` must already route through the plugin; otherwise `CellsMixin.ts` would fail to compile after the mixin deletion).

## Context

- Files to delete: `packages/core/src/view/mixin/ImageMixin.ts`, `packages/core/src/view/mixin/ImageMixin.type.ts`.
- Mixin registry files: `packages/core/src/view/mixin/_graph-mixins-apply.ts` (lines 27 and 56 currently reference `ImageMixin`), `packages/core/src/view/mixin/_graph-mixins-types.ts` (line 27 currently imports the type side-effect).
- `imageBundles` field: `packages/core/src/view/AbstractGraph.ts:107`.
- `BaseGraph` test to remove: `packages/core/__tests__/view/BaseGraph.test.ts:326-333`.
- XML fixture to update: `packages/core/__tests__/serialization/codec/all-graph-classes.test.ts:46`.
- Plan section: "File Changes" → `AbstractGraph.ts` + `ImageMixin.ts` + `ImageMixin.type.ts` + `_graph-mixins-apply.ts` + `_graph-mixins-types.ts` + the two test files.

## Success Criteria

- The two mixin files no longer exist on disk.
- Grep for `ImageMixin` across `packages/core/src/` returns no results.
- Grep for `imageBundles` across `packages/core/src/view/AbstractGraph.ts` returns no results.
- `npm run build -w packages/core` succeeds.
- `npm test -w packages/core` passes (including the Task 1 characterization tests, which now exercise the plugin-backed path via `ImageBundlePlugin` registered on `Graph` / `BaseGraph`-with-plugin — Task 6 will add the dedicated plugin unit tests; Task 1 tests must be updated mid-task if they relied on writing directly to `graph.imageBundles` — see note below).
- `npm run check:circular-dependencies -w packages/core` passes.

> **Note on Task 1 tests**: if those characterization tests write to `graph.imageBundles` directly (the pre-refactor API), they must be adapted during this task to write to `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.imageBundles` (or to construct the plugin and pass bundles via its `addImageBundle`). This adaptation is part of this task because it is the moment the API changes. The *assertions* (expected `style.image` values) must remain identical — that invariance is the proof that the refactor is behavior-preserving.
