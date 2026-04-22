# Task: Register `ImageBundlePlugin` as a built-in plugin

## Problem

The new plugin class exists (Task 2) but is not discoverable: it is not re-exported from the plugin barrel, not present in `getDefaultPlugins()`, and its id is not part of the `BuiltinPluginId` union. Without this wiring, `Graph` instances would not load it by default and TypeScript users would not get the id in autocomplete.

## Proposed Solution

Three wiring edits:

- Extend `packages/core/src/view/plugin/index.ts`: import `ImageBundlePlugin`, re-export it from the barrel in the same style as `FitPlugin`, and append it to the `getDefaultPlugins()` array so `Graph` (full-featured) ships it out of the box. `BaseGraph` continues to not load it — `BaseGraph` users opt in explicitly.
- Extend `BuiltinPluginId` in `packages/core/src/types.ts` with the literal `'image-bundle'`. Alphabetical placement keeps the list ordered.
- No change to `BaseGraph` or `Graph` class files — the plugin loads via the existing `plugins` option flow.

## Dependencies

- Task 2 (plugin class must exist to be imported).

## Context

- Barrel to modify: `packages/core/src/view/plugin/index.ts` — follow the `FitPlugin` import/export/array entry pattern already present.
- `BuiltinPluginId` location: `packages/core/src/types.ts:1154-1163`.
- Plugin id chosen: `'image-bundle'` (see Task 2).

## Success Criteria

- `ImageBundlePlugin` is re-exported from `packages/core/src/view/plugin/index.ts` and included in the array returned by `getDefaultPlugins()`.
- `'image-bundle'` is a member of `BuiltinPluginId`.
- `npm run build -w packages/core` succeeds.
- `npm run lint` passes.
- Existing tests continue to pass unchanged (nothing has been removed yet; `ImageMixin` is still in place).
