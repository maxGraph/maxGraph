# Task: Add characterization tests for `CellsMixin.postProcessCellStyle`

## Problem

`CellsMixin.postProcessCellStyle` has zero test coverage today. The upcoming refactor reroutes its internal bundle lookup from `this.getImageFromBundles(key)` to `this.getPlugin<ImageBundlePlugin>('image-bundle')?.getImageFromBundles(key) ?? null`. Without tests, we cannot prove the refactor is behavior-preserving.

## Proposed Solution

Create a dedicated test file that freezes the current observable behavior of `postProcessCellStyle` against **all 12 paths** identified in the plan (P1–P12):

- Early return on falsy `style.image` (undefined, empty string).
- Bundle resolution branches (no bundles registered, bundle registered but key not matched, bundle matched returning a plain URL).
- Data-URI normalization branches: `data:image/svg+xml,<…>` literal (URL-encode after pos 19), `data:image/svg+xml,%3C…` already-encoded (unchanged), `data:image/…,xyz` missing base64 infix (inject `;base64,`), already-base64 (unchanged), degenerate no-comma input (unchanged).
- Data-URI transform applies even when bundle lookup fails (key used as fallback).
- First-bundle-wins semantics when multiple bundles contain the same key.

Use `test.each` where it reduces duplication, per testing conventions. Instantiate with `new BaseGraph()` (no container) — fastest path, same pattern as the existing `BaseGraph.test.ts` isolation tests. Load bundles via `graph.imageBundles.push(new ImageBundle())` (current API, still valid before the refactor).

The file must pass against the **current** `ImageMixin`-based implementation. It will also need to pass unchanged after the refactor (Task 4 reroutes the internal call without touching observable behavior).

This task is the whole of the first commit on the PR: `test(graph): characterize CellsMixin.postProcessCellStyle`. Do not include any source change.

## Dependencies

None. First task on the branch.

## Context

- Method to pin: `packages/core/src/view/mixin/CellsMixin.ts:274-305` (the full `postProcessCellStyle` body).
- All 12 paths (P1–P12) enumerated in `plan.md` → "Testing Strategy" → table.
- Test file destination: `packages/core/__tests__/view/mixin/CellsMixin.postProcessCellStyle.test.ts`.
- Testing conventions: `.claude/rules/testing/conventions.md` — Jest + jsdom, `@swc/jest`, omit `.js` extensions in test imports, use `test.each` for data-driven tests.
- Reference for `BaseGraph` instantiation without container: `packages/core/__tests__/view/BaseGraph.test.ts:326-333` (current `imageBundles` isolation test — a similar instantiation pattern).

## Success Criteria

- New file `packages/core/__tests__/view/mixin/CellsMixin.postProcessCellStyle.test.ts` exists and covers all 12 paths from the plan.
- `npm test -w packages/core -- CellsMixin.postProcessCellStyle` passes on the current (pre-refactor) codebase.
- `npm run build -w packages/core` still succeeds.
- `npm run lint` passes for the new file.
- No other file is modified.
- The file is committed as a single commit with subject `test(graph): characterize CellsMixin.postProcessCellStyle` and a body explaining the pre-refactor characterization intent.
