# Task: Document the breaking changes in `CHANGELOG.md`

## Problem

This migration is a `refactor!` commit that changes the public API surface, the XML serialization format, and the default plugin set for `BaseGraph`. Users must have a single, clear, user-facing description of what broke and how to migrate. The repo-root `CHANGELOG.md` already has an `## Unreleased` section with a `**Breaking Changes**:` bullet list in use — the migration notes must land there.

## Proposed Solution

Append bullets to the existing `**Breaking Changes**:` list under `## Unreleased` in the repo-root `CHANGELOG.md`. Do not create a new section. Match the tone, length, and formatting of the existing entries (look at the `EdgeHandler.isHandleVisible()` / `EdgeStyleRegistryInterface` bullets already present — sentence-form, backticked code identifiers, migration guidance inline).

The five canonical items to document (see plan.md → "Breaking Changes" section for exact wording):

1. Image-bundle methods (`addImageBundle`, `removeImageBundle`, `getImageFromBundles`) removed from the graph surface — migration: `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.<method>(...)`.
2. `imageBundles` property removed from the graph — migration: `graph.getPlugin<ImageBundlePlugin>('image-bundle')?.imageBundles`.
3. `BaseGraph` no longer ships image-bundle support — users must register `ImageBundlePlugin` explicitly. `Graph` unchanged (plugin is in `getDefaultPlugins()`).
4. XML serialization of `<Graph>` / `<BaseGraph>` no longer emits `<Array as="imageBundles" />`. Existing XML documents with that element decode without error but the field is silently ignored. Users who persist bundles must now serialize plugin state separately.
5. Silent fallback when `ImageBundlePlugin` is not registered: `CellsMixin.postProcessCellStyle` uses the raw style key as the image path (equivalent to the pre-existing "no bundle matched" branch).

These five bullets can be grouped into fewer user-facing bullets if the existing tone is more concise — use judgment to avoid repetition without losing actionable migration guidance.

## Dependencies

- Task 5 (the actual breaking changes must exist in code before they are documented).

## Context

- CHANGELOG location: `/CHANGELOG.md` at repo root.
- Existing `## Unreleased` section with `**Breaking Changes**:` list — review the two existing bullets about `EdgeHandler.isHandleVisible()` and `EdgeStyleRegistryInterface` for tone.
- Plan section: "Breaking Changes" (canonical list of five items) and "Documentation" → CHANGELOG.md (formatting rules).

## Success Criteria

- `CHANGELOG.md` under `## Unreleased` → `**Breaking Changes**:` contains entries covering all five items above, in the style of existing entries.
- No new section headings created.
- The file is otherwise untouched (no drive-by edits to other sections).
- `npm run lint` does not complain about the file (CHANGELOG is not typically linted but do sanity-check).
