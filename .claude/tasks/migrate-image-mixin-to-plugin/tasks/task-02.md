# Task: Create the `ImageBundlePlugin` class

## Problem

`ImageMixin` currently exposes three methods (`addImageBundle`, `removeImageBundle`, `getImageFromBundles`) via declaration merging onto `AbstractGraph`, with its state (`imageBundles: ImageBundle[]`) living on `AbstractGraph` itself because arrays cannot be safely moved into mixins (shared-state issue documented at `AbstractGraph.ts:92-97`). We need a plugin class that owns both the state and the behavior, so the state can eventually leave `AbstractGraph`.

## Proposed Solution

Create `ImageBundlePlugin` in the plugin folder, following the `FitPlugin` template. It implements `GraphPlugin`, exposes the three methods as regular class methods, owns its own `imageBundles: ImageBundle[] = []` field (class-instance isolation removes the shared-state concern that blocked the mixin), and has a no-op `onDestroy()`.

The plugin id must be `'image-bundle'` per the project's Plugin ID Naming rule (kebab-case for multi-word ids; `'image'` would be too generic and is reserved for future image-related plugins such as a potential warning-image or background-image plugin).

Class-level JSDoc must document the relationship with `CellsMixin.postProcessCellStyle`: the mixin delegates bundle key resolution to this plugin when registered; when the plugin is absent, bundle lookup is silently skipped and the raw style key is used as the image path. Port the method-level JSDoc from `ImageMixin.type.ts` verbatim.

Constructor takes `AbstractGraph` (matches `FitPlugin`); the reference is not strictly needed by the three current methods but keeps the pattern consistent and leaves the door open for future extension.

## Dependencies

- Task 1 must be committed first (characterization tests — separate commit, precedes all refactor tasks).

## Context

- Template to copy the structure from: `packages/core/src/view/plugin/FitPlugin.ts` — in particular `static readonly pluginId`, `constructor(private readonly graph: AbstractGraph)`, `onDestroy()` no-op.
- Types reference: `packages/core/src/types.ts:1173-1181` (`GraphPluginConstructor` / `GraphPlugin` interfaces).
- Source for the three methods: `packages/core/src/view/mixin/ImageMixin.ts` — port verbatim, promoting object-literal methods to class methods with explicit parameter/return types.
- Source for the method JSDoc: `packages/core/src/view/mixin/ImageMixin.type.ts:20-34`.
- Plugin id naming rule: `.claude/rules/architecture/coding-practices.md` → "Plugin ID Naming".
- Coding practices for imports: `.js` extensions required, `import type` for type-only usage (`.claude/rules/architecture/coding-practices.md`).
- Target path: `packages/core/src/view/plugin/ImageBundlePlugin.ts`.

## Success Criteria

- New file `packages/core/src/view/plugin/ImageBundlePlugin.ts` exists, exports `ImageBundlePlugin` as a named export.
- `pluginId === 'image-bundle'`, class implements `GraphPlugin`.
- `npm run build -w packages/core` succeeds.
- `npm run lint` passes for the new file.
- No other file is modified (the plugin is not wired in anywhere yet; that is Task 3).
