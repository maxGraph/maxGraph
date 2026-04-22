# Task: Add dedicated unit tests for `ImageBundlePlugin`

## Problem

`ImageMixin` had no dedicated tests (coverage report showed the three methods entirely uncovered). Moving the behavior to a plugin class is a good opportunity to cover it properly — including the per-instance isolation check that the old `BaseGraph.test.ts:326-333` test used to enforce on the array field.

## Proposed Solution

Create a unit test file for `ImageBundlePlugin`. Required scenarios:

- Two plugin instances (attached to two different graphs, or constructed standalone) each get their own fresh `imageBundles` array — the regression check migrated from `BaseGraph.test.ts`.
- `addImageBundle(bundle)` appends to the internal array.
- `removeImageBundle(bundle)` removes only the matching bundle by reference; other bundles are untouched.
- `getImageFromBundles(key)` returns the value of the first matching bundle.
- `getImageFromBundles(key)` returns `null` when no bundle matches.
- `getImageFromBundles(key)` returns `null` when the key is falsy (empty string).
- `onDestroy()` does not throw (smoke test).

Use the same instantiation pattern chosen during Task 2 (either `new ImageBundlePlugin(stubGraph)` or `new BaseGraph({ plugins: [ImageBundlePlugin] })`) — pick whichever is lighter and matches existing plugin test style if any.

## Dependencies

- Task 2 (plugin class must exist).
- Task 5 (the tests should run against the final state where the plugin is the sole owner of bundle state; running them earlier is possible but adds noise).

## Context

- Test file destination: `packages/core/__tests__/view/plugin/ImageBundlePlugin.test.ts`.
- Pattern to mirror (if a similar plugin test exists): search `packages/core/__tests__/view/plugin/` for the closest match; otherwise free-form with Jest conventions.
- Testing conventions: `.claude/rules/testing/conventions.md`.
- The deleted isolation test in `BaseGraph.test.ts` (referenced in Task 5) covered the per-instance `imageBundles` array — that case is now on this plugin's test list.

## Success Criteria

- New file `packages/core/__tests__/view/plugin/ImageBundlePlugin.test.ts` exists.
- All seven scenarios above are covered by at least one test each (`test.each` is fine for parametric cases).
- `npm test -w packages/core -- ImageBundlePlugin` passes.
- `npm test -w packages/core -- --coverage` shows the three plugin methods as covered.
