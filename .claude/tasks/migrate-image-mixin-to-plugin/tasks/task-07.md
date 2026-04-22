# Task: Update JSDoc on `ImageBundlePlugin`, `CellStateStyle.image`, `ImageBundle`, and `CellsMixin.postProcessCellStyle`

## Problem

After the refactor, several pieces of source documentation drift out of sync with the new reality: the `CellStateStyle.image` JSDoc never mentioned image bundles at all; `ImageBundle.ts` still shows `graph.addImageBundle(bundle);` as the canonical usage; `CellsMixin.postProcessCellStyle` silently depends on a plugin but does not say so; and the new `ImageBundlePlugin` must carry forward the JSDoc from the old `ImageMixin.type.ts` plus a class-level note about the `CellsMixin` consumer.

## Proposed Solution

Four JSDoc edits, all documentation-only, no behavior change:

- `packages/core/src/types.ts` → `CellStateStyle.image` property (lines 373-380): add a paragraph stating the value MAY be a key registered via an `ImageBundle`. When `ImageBundlePlugin` is registered, such keys are resolved to the underlying URL/data-URI by `CellsMixin.postProcessCellStyle`. When the plugin is absent or no bundle matches, the raw key is used as the image path. Cross-reference `{@link ImageBundle}` and `{@link ImageBundlePlugin}`.
- `packages/core/src/view/image/ImageBundle.ts` (class-level JSDoc, lines 32-46): change the `graph.addImageBundle(bundle);` usage line to `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.addImageBundle(bundle);`, and add a note that `ImageBundlePlugin` must be registered (it is, by default, on `Graph`; `BaseGraph` users must add it explicitly). Match the style of other JSDoc examples in the codebase.
- `packages/core/src/view/plugin/ImageBundlePlugin.ts` class-level JSDoc: if Task 2 did not already include it, add the paragraph about `CellsMixin.postProcessCellStyle` delegating bundle key resolution to this plugin, and the silent fallback behavior when absent.
- `packages/core/src/view/mixin/CellsMixin.ts` → `postProcessCellStyle` method JSDoc: add a sentence saying bundle-based image key resolution is delegated to `{@link ImageBundlePlugin}` (id `'image-bundle'`); when the plugin is not registered the lookup is skipped and the raw style key is used as the image path.

## Dependencies

- Task 2 (the plugin class must exist so `{@link ImageBundlePlugin}` resolves).
- Task 5 (the method surface must be final; referring to a plugin from a mixin's JSDoc only makes sense once the migration is complete).

## Context

- `CellStateStyle.image` location: `packages/core/src/types.ts:373-380`.
- `ImageBundle` JSDoc location: `packages/core/src/view/image/ImageBundle.ts:26-68`.
- `postProcessCellStyle` method JSDoc location: `packages/core/src/view/mixin/CellsMixin.ts:274-305` (method body is here; JSDoc must be added just above).
- Plan sections: "File Changes" → `packages/core/src/types.ts`, `ImageBundle.ts`, `ImageBundlePlugin.ts`, `CellsMixin.ts`.

## Success Criteria

- The four JSDoc blocks are updated as described.
- TypeDoc-style `{@link …}` references compile cleanly (no dangling links — verify by running the API docs build if time permits, otherwise by grep).
- `npm run build -w packages/core` succeeds (JSDoc is not compiled, but the TypeScript build remains green).
- `npm run lint` passes.
