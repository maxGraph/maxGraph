# Implementation Plan: Migrate ImageMixin to ImageBundlePlugin

## Overview

Convert `ImageMixin` into a standalone `ImageBundlePlugin` that owns `imageBundles` and exposes `addImageBundle` / `removeImageBundle` / `getImageFromBundles`. Remove the three methods and the `imageBundles` field from `AbstractGraph`. Rewire the single internal consumer (`CellsMixin.postProcessCellStyle`) to call the plugin via `graph.getPlugin()`. Register the new plugin in `getDefaultPlugins()` so `Graph` keeps working without user action; `BaseGraph` users must opt in explicitly. This is a breaking change (`refactor!`) and the proof-of-concept for the larger mixin-to-plugin migration.

## Dependencies

Work happens in three commits on the same PR, in this order:

**Commit 1 — plugin id naming convention (docs only, no code).**

1. Add a "Plugin ID Naming" section to `.claude/rules/architecture/coding-practices.md` (kebab-case for multi-word ids, no `Plugin`/`Handler` suffix in ids, prefer precise scope, legacy handlers grandfathered).

**Commit 2 — characterization tests (no behavior change).**

2. Add `packages/core/__tests__/view/mixin/CellsMixin.postProcessCellStyle.test.ts` covering all paths of the method (see "Testing Strategy"). Tests pass against the **current** `ImageMixin`-based implementation.
3. Rationale: the method has no existing tests, and the refactor reroutes its internal bundle lookup through `getPlugin()`. Writing tests first guarantees the refactor is behavior-preserving.

**Commit 3 — the migration.**

4. Create `ImageBundlePlugin` and its barrel export — no other code depends on it yet.
5. Rewire `CellsMixin.postProcessCellStyle` to go through `getPlugin()`. Compiles because the mixin methods still exist and the plugin has been added.
6. Delete `ImageMixin` files and remove them from the mixin registry.
7. Remove `imageBundles` from `AbstractGraph`.
8. Register `ImageBundlePlugin` in `getDefaultPlugins()` and add `'image-bundle'` to `BuiltinPluginId`.
9. Update `CellStateStyle.image` JSDoc, `ImageBundle.ts` JSDoc, `BaseGraph.test.ts`, `all-graph-classes.test.ts`, the new `ImageBundlePlugin.test.ts`, and the repo-root `CHANGELOG.md`.
10. Run the full CI sequence from `CLAUDE.md`.

The characterization tests from Commit 2 must still pass unchanged at the end of Commit 3 (they exercise `graph.postProcessCellStyle(style)` which remains available as a `CellsMixin` method; only the internal bundle-lookup routing changes).

## File Changes

### `packages/core/src/view/plugin/ImageBundlePlugin.ts` (CREATE)

- Create the new plugin class following the `FitPlugin` template at `packages/core/src/view/plugin/FitPlugin.ts`.
- Use `static readonly pluginId = 'image-bundle'`.
- Constructor signature: `constructor(private readonly graph: AbstractGraph)` — matches FitPlugin. The `graph` reference is not strictly needed by the current three methods but keep it for consistency and future extension.
- Declare the `imageBundles: ImageBundle[] = []` field on the plugin instance (initialized in the field declaration, so each plugin instance gets a fresh array — no shared-state issue since plugins are class instances, not mixin applications).
- Port the three methods verbatim from `ImageMixin.ts`, converting them from object-literal methods with implicit `this` typing into regular class methods with proper parameter/return types: `addImageBundle(bundle: ImageBundle): void`, `removeImageBundle(bundle: ImageBundle): void`, `getImageFromBundles(key: string): string | null`.
- `removeImageBundle` in the mixin reassigns `this.imageBundles = tmp` — in the plugin, prefer `this.imageBundles.splice(index, 1)` or use `Array.prototype.filter` assigned back; semantics must stay identical (remove first occurrence by reference).
- Port the JSDoc from `ImageMixin.type.ts:20-34` onto the three methods.
- **Class-level JSDoc** must explicitly document the internal dependency: `CellsMixin.postProcessCellStyle` resolves style image keys through this plugin; when the plugin is not registered on a `BaseGraph`, bundle resolution is silently skipped and the raw key is used as the image path. Add `@category Plugin` and `@since` tags matching the FitPlugin style.
- Implement `onDestroy()` as a no-op (matches FitPlugin). Add `/** Do nothing here. */` comment line for symmetry.
- License header: copy from `FitPlugin.ts` (2025-present).
- Imports: `import type { GraphPlugin } from '../../types.js'`, `import type { AbstractGraph } from '../AbstractGraph.js'`, `import type ImageBundle from '../image/ImageBundle.js'`. All with `.js` extensions per `.claude/rules/architecture/coding-practices.md`.

### `packages/core/src/view/plugin/index.ts`

- Add `import { ImageBundlePlugin } from './ImageBundlePlugin.js';` alongside the existing plugin imports.
- Add `export * from './ImageBundlePlugin.js';` in the re-export block, following the `FitPlugin` pattern at line 30.
- Add `ImageBundlePlugin` to the `getDefaultPlugins()` array (exact position in the array is not semantically meaningful; place it after `FitPlugin` or alphabetically adjacent — pick a spot that preserves stable ordering).

### `packages/core/src/types.ts`

- Add `| 'image-bundle'` to the `BuiltinPluginId` union at lines 1154-1163 (alphabetical placement between `'fit'` and `'PanningHandler'` keeps the list ordered).

### `packages/core/src/types.ts` — `CellStateStyle.image` JSDoc

- Update the JSDoc of the `image?: string` property on `CellStateStyle` (at lines 373-380 around `types.ts`). Current doc says only that the value is an image URL and describes the data-URI shortcut format. It makes **no mention** of image bundles.
- Add a paragraph explicitly stating that the value MAY also be a key that references an image registered via an `ImageBundle`. When `ImageBundlePlugin` is registered, such keys are resolved to the underlying URL/data-URI by `CellsMixin.postProcessCellStyle`. If the plugin is not registered, or no bundle contains the key, the raw key is used as the image path unchanged.
- Cross-reference `{@link ImageBundle}` and `{@link ImageBundlePlugin}` so TypeDoc renders links.

### `packages/core/src/view/mixin/CellsMixin.ts`

- Line 57: remove `| 'getImageFromBundles'` from the `PartialGraph` Pick type. Add `| 'getPlugin'` to the same Pick (if not already there — verify; `getPlugin` is the access mechanism the method now relies on).
- Line 279 inside `postProcessCellStyle`: replace `let image = this.getImageFromBundles(key);` with a call routed through the plugin. The new expression must return `string | null` to preserve the downstream `if (image)` / `else image = key` branch semantics unchanged. Use `this.getPlugin<ImageBundlePlugin>('image-bundle')?.getImageFromBundles(key) ?? null`.
- Add `import type { ImageBundlePlugin } from '../plugin/ImageBundlePlugin.js';` at the top (type-only import — not used at runtime).
- **Update the JSDoc of `postProcessCellStyle`** to explicitly state the `ImageBundlePlugin` dependency: document that bundle-based image key resolution is delegated to `ImageBundlePlugin` (id `'image-bundle'`), and that when the plugin is not registered the lookup is skipped and the raw style key is used as the image path. Cross-reference the plugin with `{@link ImageBundlePlugin}` so TypeDoc generates a link.

### `packages/core/src/view/mixin/ImageMixin.ts` (DELETE)

- Remove the file.

### `packages/core/src/view/mixin/ImageMixin.type.ts` (DELETE)

- Remove the file.

### `packages/core/src/view/mixin/_graph-mixins-apply.ts`

- Remove the `import { ImageMixin } from './ImageMixin.js';` line (line 27).
- Remove `ImageMixin,` from the array passed to the loop (line 56).

### `packages/core/src/view/mixin/_graph-mixins-types.ts`

- Remove the `import './ImageMixin.type.js';` line (line 27).

### `packages/core/src/view/AbstractGraph.ts`

- Remove line 107: `imageBundles: ImageBundle[] = [];`.
- Check the `import type ImageBundle from '...'` statement at the top of the file: if `ImageBundle` is no longer referenced anywhere else in `AbstractGraph.ts` after the deletion, remove the import. Otherwise keep it.
- The multi-line comment block at lines 92-97 explaining shared-state constraints remains accurate for `cells`, `mouseListeners`, `multiplicities`, `options`, `alternateEdgeStyle` — do not touch it.

### `packages/core/src/view/image/ImageBundle.ts`

- Update the JSDoc usage example at lines 32-46. The final line currently reads `graph.addImageBundle(bundle);`. Change it to demonstrate the new plugin access pattern: `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.addImageBundle(bundle);` with a note that `ImageBundlePlugin` must be registered (it is in `getDefaultPlugins()`, so the example works unchanged for `Graph` users).
- If the JSDoc needs an import example for `ImageBundlePlugin`, add a line in the code block showing `import { ImageBundlePlugin } from '@maxgraph/core'` style — match the style of other JSDoc examples in the codebase.

### `.claude/rules/architecture/coding-practices.md`

- Already updated in advance of the refactor: a new "Plugin ID Naming" section codifies the kebab-case convention for multi-word plugin ids, pins single-word ids like `'fit'` as allowed, forbids the `Plugin`/`Handler` suffix in ids, prefers precise scope (`'image-bundle'` over `'image'`), and calls out the legacy handler ids as grandfathered.
- No further edit needed during Commit 3; the refactor must follow this rule.

### `CHANGELOG.md` (repo root)

- Append bullets to the existing `## Unreleased` > `**Breaking Changes**:` list. Use the five items from the "Breaking Changes" section of this plan, converted into sentence-form bullets that match the existing file style (see the two `EdgeHandler.isHandleVisible()` / `EdgeStyleRegistryInterface` bullets already present for the tone and length).
- Do not create a new section heading — reuse the existing `**Breaking Changes**:` list under `## Unreleased`.

## Testing Strategy

### `packages/core/__tests__/view/mixin/CellsMixin.postProcessCellStyle.test.ts` (CREATE — Commit 2, before any source change)

Characterization tests. Goal: freeze the current observable behavior of `postProcessCellStyle` before the refactor reroutes its internal bundle lookup, so any regression in Commit 3 is caught.

Test environment: instantiate via `new BaseGraph()` (no container) and call `graph.postProcessCellStyle(style)`. Use `ImageBundle` instances loaded onto `graph.imageBundles` directly (current API — still valid in Commit 2 because the field has not yet been moved).

All paths in the method must be covered. Each test uses a minimal `CellStateStyle` object — at least the `image` field, others left undefined.

| # | Scenario | Expected outcome |
|---|----------|------------------|
| P1 | `style.image` is `undefined` | Method returns the same style object, `style.image` still `undefined`. Early return at line 275. |
| P2 | `style.image` is an empty string | Same as P1 (empty string is falsy). |
| P3 | `style.image` is a key, **no** bundle registered | `style.image` unchanged. `image` local falls back to the key but does not start with `data:image/`, so no transform runs. |
| P4 | `style.image` is a key, bundle registered but key does not match | Same as P3. |
| P5 | `style.image` is a key that matches a bundle returning a plain URL (e.g. `https://example.com/pic.png`) | `style.image` replaced with the URL. No data-URI transform. |
| P6 | `style.image` is a key that matches a bundle returning a `data:image/svg+xml,<svg ...>` value (literal `<`) | `style.image` contains the prefix `data:image/svg+xml,` followed by the URL-encoded SVG body (the part after position 19). |
| P7 | `style.image` is a key that matches a bundle returning a `data:image/svg+xml,%3C...` value (already encoded) | `style.image` returned unchanged — the `else if` excludes this prefix from the base64 injection branch. |
| P8 | `style.image` is a key that matches a bundle returning `data:image/png,xyz` (no `;base64,` infix) | `style.image` becomes `data:image/png;base64,xyz` — the `;base64,` marker is injected before the comma. |
| P9 | `style.image` is a key that matches a bundle returning `data:image/png;base64,xyz` (already base64) | `style.image` returned unchanged. |
| P10 | `style.image` is itself a plain `data:image/gif,abc` value (no bundle lookup match) | `style.image` becomes `data:image/gif;base64,abc`. Validates that the data-URI transform applies even without bundle resolution (fallback branch where `image = key`). |
| P11 | `style.image` is `data:image/` with no comma (degenerate input) | `style.image` unchanged — `comma > 0` guard prevents the injection. |
| P12 | Two bundles registered; the first contains the key, the second also contains it under the same key | First match wins — `style.image` takes the value from the first bundle added. |

Use `test.each` where it reduces duplication (see `.claude/rules/testing/conventions.md`). Keep one explicit `test(...)` per scenario if that hurts readability — prioritize clarity.

The file must pass against the CURRENT `main`-equivalent implementation (with `ImageMixin`) AND against the post-migration implementation (with `ImageBundlePlugin`). Do not edit this file in Commit 3 — its stability is the migration's proof.

### `packages/core/__tests__/view/plugin/ImageBundlePlugin.test.ts` (CREATE)

- New dedicated test file mirroring the layout of existing plugin tests if any exist; otherwise free-form using Jest conventions from `.claude/rules/testing/conventions.md`.
- Test cases:
  - Instantiating two `BaseGraph`s each with `ImageBundlePlugin` registered yields per-instance `imageBundles` arrays (regression check migrated from `BaseGraph.test.ts`).
  - `addImageBundle` appends to the internal array.
  - `removeImageBundle` removes only the matching bundle by reference and leaves others intact.
  - `getImageFromBundles` returns the value of the first matching bundle; returns `null` when no bundle matches; returns `null` when the key is empty/falsy.
  - `onDestroy` does not throw (smoke test).
- Instantiate the plugin directly with a minimal graph stub (or via `new BaseGraph(... ,{ plugins: [ImageBundlePlugin] })` if simpler — follow whatever pattern existing plugin tests use).
- Import style follows testing rule: no `.js` extension in test imports.

### `packages/core/__tests__/view/BaseGraph.test.ts`

- Delete the `test('imageBundles', ...)` block at lines 326-333: it asserts per-instance isolation of `graph.imageBundles`, but the field no longer exists on `BaseGraph`. The equivalent regression check is now covered by the new `ImageBundlePlugin.test.ts` case described above.
- Remove the now-unused `ImageBundle` import from line 30 if no other test in the file uses it — verify by grep, keep the import only if other tests still need it.

### `packages/core/__tests__/serialization/codec/all-graph-classes.test.ts`

- Remove the `<Array as="imageBundles" />` line from the XML template string in `buildXml()` at line 46. After migration, the seed instance passed to `GraphCodec` / `BaseGraphCodec` no longer has an `imageBundles` field, so the codec no longer emits that element.
- Run the full test file to confirm no other fixture references `imageBundles` — the grep earlier showed only this one occurrence.

### Manual verification

- Run the full CI validation sequence documented in `CLAUDE.md` before declaring the task done (see "Rollout Considerations" below).
- Build `packages/ts-example-selected-features/` and visually confirm it still renders (this package demonstrates `BaseGraph` + selective plugins and is the canonical smoke-test target for plugin changes).

## Breaking Changes

The following items MUST be spelled out verbatim in both the commit body and the CHANGELOG entry (see below), and must appear in the PR description:

1. **Image bundle methods removed from the graph surface.** `AbstractGraph.addImageBundle`, `AbstractGraph.removeImageBundle`, and `AbstractGraph.getImageFromBundles` no longer exist (and thus are no longer inherited by `Graph` or `BaseGraph`). Migrate all call sites from `graph.addImageBundle(bundle)` (and the two siblings) to `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.addImageBundle(bundle)`.
2. **`imageBundles` property removed.** `AbstractGraph.imageBundles: ImageBundle[]` no longer exists. Migrate direct property access to `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.imageBundles`.
3. **`BaseGraph` no longer ships image-bundle support.** `BaseGraph` users must explicitly register `ImageBundlePlugin` via the `plugins` option. `Graph` continues to work unchanged because `ImageBundlePlugin` is included in `getDefaultPlugins()`.
4. **XML serialization format change.** `GraphCodec` and `BaseGraphCodec` no longer emit `<Array as="imageBundles" />` inside `<Graph>` / `<BaseGraph>` elements because the field has moved off the graph instance. On decode, existing XML documents containing that element are accepted without error but the field is silently ignored (standard `ObjectCodec` behavior for unknown fields). Users who persist image bundles as part of the graph XML must now serialize `ImageBundlePlugin` state separately.
5. **Silent fallback when `ImageBundlePlugin` is not registered.** `CellsMixin.postProcessCellStyle` now resolves style image keys only when `ImageBundlePlugin` is registered; without the plugin, the raw style key is used as the image path (identical to the pre-existing "no bundle matched" path). Relevant to `BaseGraph` consumers that do not add the plugin.

## Documentation

- **Repo-root `CHANGELOG.md`**: an "Unreleased" section already exists near the top with a `**Breaking Changes**:` bullet list. Append one bullet per item in the Breaking Changes section above to that list, preserving the file's existing style (sentence-form bullets, no trailing period required, backticks around code identifiers). Keep the wording user-facing — link to the migration snippet `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.<method>(...)` as the actionable fix.
- **`packages/core/src/view/image/ImageBundle.ts` JSDoc**: the file-level JSDoc usage example update described above is the only prose doc change in the core source.
- **TypeDoc-generated API pages** under `packages/core/build/api/` regenerate from source on doc build; no manual edits required.
- **Commit body** must reproduce the Breaking Changes section above (or a faithful condensation of it) so a reader of `git log` gets the migration info without opening the PR.

## Rollout Considerations

### Breaking change classification and commit decomposition

The plugin id naming convention (originally planned as Commit 1) was cherry-picked into `main` via PR #1049 and is already in effect; the rebase dropped the local duplicate. The remaining work on `refactor/migrate-image-mixin-to-plugin` is **two commits**:

1. `test(graph): characterize CellsMixin.postProcessCellStyle` — adds only the new `CellsMixin.postProcessCellStyle.test.ts` file. No source change. Tests pass against the current `ImageMixin`-based implementation.
2. `refactor!: convert ImageMixin to ImageBundlePlugin` — all source changes (plugin creation, `CellsMixin` rewire, `ImageMixin` deletion, `imageBundles` removal from `AbstractGraph`, `getDefaultPlugins()` registration, `BuiltinPluginId` addition, JSDoc updates on `ImageBundle`, `CellStateStyle.image`, the plugin itself, and on `CellsMixin.postProcessCellStyle`), test adjustments (`BaseGraph.test.ts`, `all-graph-classes.test.ts`, new `ImageBundlePlugin.test.ts`), and the `CHANGELOG.md` entry. The characterization test file from the first commit must continue to pass unchanged.

Commit type convention per `.claude/rules/git/commit-conventions.md`. The `!` marker on Commit 3's subject signals the breaking change; the body reproduces the five items from the "Breaking Changes" section verbatim.

Rationale for three commits: the atomic-source-change argument (no non-compiling intermediate state) still holds for the refactor itself — it is Commit 3 in its entirety. Pulling the new `postProcessCellStyle` characterization tests into Commit 2 (preceding) makes the refactor provably behavior-preserving under review: any reviewer can check out Commit 2 and run the tests against the pre-refactor code, then check out Commit 3 and see the same tests still green. Pulling the docs-only rule update into Commit 1 (preceding both) makes it obvious that the code in Commit 3 complies with a rule that was already in effect. Three small commits, one PR.

### Pre-PR validation

Run the CI sequence from `CLAUDE.md`, in order, and fix issues as they surface:

```
npm run build -w packages/core
npm run test-check -w packages/core
npm test -w packages/core -- --coverage
npm test -w packages/ts-support
./scripts/build-all-examples.bash
npm run build -w packages/html
npm run check:circular-dependencies -w packages/core
npm run lint
npm run check:npm-package -w packages/core
```

Particular attention to:
- `check:circular-dependencies` — the new `ImageBundlePlugin` import in `CellsMixin.ts` (a mixin importing a plugin) is a new cross-directory link. Verify no cycle appears. If one does, keep the import type-only (which it already is) and/or move the `ImageBundlePlugin` type to a shared types file.
- `build-all-examples.bash` — shakes out any example that implicitly relied on `graph.imageBundles` or the three methods existing on `AbstractGraph`.
- Coverage — the new `ImageBundlePlugin.test.ts` should lift coverage on the three methods, which were previously uncovered per the lcov report.

### Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| External consumer calls `graph.addImageBundle(...)` and breaks silently at runtime | Medium | Type signatures are removed from `AbstractGraph` ⇒ TypeScript users get a compile error, not silent runtime failure. Commit body calls it out explicitly. JS-only users must read release notes. |
| `postProcessCellStyle` silently no-ops bundle lookup on `BaseGraph` without the plugin | Low | Existing behavior: method assigns `image = key` when bundle lookup returns null — identical visible behavior for a user who never registered bundles. Call out in commit body under "BaseGraph users must opt in". |
| XML documents containing `<Array as="imageBundles" />` no longer round-trip | Low | `ObjectCodec` tolerates unknown fields on decode, so no exception; the data is silently dropped. Acceptable under `refactor!`. Mentioned in commit body. |
| Circular dep introduced by `CellsMixin` → `ImageBundlePlugin` import | Low | Import is `import type` only, erased at compile time. `check:circular-dependencies` must pass in CI. |
| Shared-state regression reappears in the plugin | Very Low | Each `new ImageBundlePlugin(graph)` creates its own `imageBundles = []` field — class instances do not share state. Covered by the dedicated isolation test. |

### Out of scope for this PR

- Any changes to other mixins in the migration plan (PortsMixin, TooltipMixin, etc.) — those are separate PRs.
- Adding a backwards-compatibility shim on `AbstractGraph` — explicitly rejected in the design decisions; breaks tree-shaking.
- Changing the serialization format to persist plugin state generically — a larger concern tracked separately if needed.
