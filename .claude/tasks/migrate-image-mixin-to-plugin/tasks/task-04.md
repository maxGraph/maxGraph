# Task: Reroute `CellsMixin.postProcessCellStyle` through `getPlugin()`

## Problem

`CellsMixin.postProcessCellStyle` currently calls `this.getImageFromBundles(key)` directly, which resolves via the declaration-merged `ImageMixin` method on `AbstractGraph`. After the upcoming removal of `ImageMixin`, that method will no longer exist on the graph — the call must go through the plugin instance instead. We want to make this rerouting BEFORE the mixin is deleted so the build stays green at every step and the characterization tests from Task 1 can verify that observable behavior is unchanged.

## Proposed Solution

Change the single call site in `CellsMixin.postProcessCellStyle` to route through the plugin via `this.getPlugin<ImageBundlePlugin>('image-bundle')?.getImageFromBundles(key) ?? null`. The `?? null` keeps the expression's type as `string | null`, preserving the downstream `if (image)` / `else image = key` branch semantics exactly.

Update the `PartialGraph` type alias at the top of `CellsMixin.ts` to match: remove `'getImageFromBundles'` (no longer called directly on `this`), add `'getPlugin'` (if not already present) because the method now goes through it.

Add a type-only import of `ImageBundlePlugin` at the top of the file. The `import type` keyword prevents the mixin from holding a runtime reference to the plugin, preserving the current import graph shape for circular-dependency checks.

At this point, both paths coexist: `ImageMixin` is still applied (so `this.imageBundles` and friends still work), and the plugin is also registered (so `getPlugin('image-bundle')` returns an instance). The rerouted call resolves through the plugin's `imageBundles` array, but that array is empty unless users have added bundles via the plugin — for existing callers who use `graph.addImageBundle(...)`, those bundles still land on `graph.imageBundles` (the mixin-managed array on `AbstractGraph`), NOT on the plugin's own array. So temporarily during this task, **image-bundle resolution will effectively stop working until Task 5** unifies the storage. This is acceptable because the characterization tests from Task 1 run against the pre-refactor commit, and the post-refactor commit will be Task 5 + Task 4 combined.

> **Important**: Because of this transient mismatch, Tasks 4 and 5 are expected to land in the same commit (the `refactor!` commit). Do not split them into separate commits.

## Dependencies

- Task 2 (the plugin class must exist to be imported).
- Task 3 (the plugin must be registered in `getDefaultPlugins()` so `Graph` instances have it available at runtime; `getPlugin('image-bundle')` returns a real instance).

## Context

- Call site: `packages/core/src/view/mixin/CellsMixin.ts:279`.
- `PartialGraph` Pick type to update: `packages/core/src/view/mixin/CellsMixin.ts:42-83`.
- Check whether `'getPlugin'` is already in that Pick — grep shows it is not in the earlier exploration, so add it.
- Plan section: "File Changes" → `packages/core/src/view/mixin/CellsMixin.ts`.

## Success Criteria

- The string `this.getImageFromBundles(key)` no longer appears in `CellsMixin.ts`.
- `this.getPlugin<ImageBundlePlugin>('image-bundle')?.getImageFromBundles(key) ?? null` is used instead.
- `PartialGraph` includes `'getPlugin'` and no longer includes `'getImageFromBundles'`.
- `npm run build -w packages/core` succeeds.
- The characterization tests from Task 1 **still pass** as-is (they write to `graph.imageBundles` directly, which currently bypasses the plugin — acceptable transiently; they will be re-verified at the end of Task 5).
- Note in the implementation log that image-bundle resolution is temporarily broken for users calling `graph.addImageBundle(...)` until Task 5 unifies the storage.
