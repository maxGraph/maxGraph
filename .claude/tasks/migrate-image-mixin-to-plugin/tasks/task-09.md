# Task: Run the full CI validation sequence and finalize the refactor commit

## Problem

All source and test edits are in place (Tasks 2–8). Before declaring the refactor done, we must run the full CI validation sequence documented in `CLAUDE.md` to make sure nothing downstream was broken by the breaking change — examples that implicitly relied on `graph.imageBundles`, circular dependencies introduced by the `CellsMixin` → `ImageBundlePlugin` type import, coverage regressions, etc.

## Proposed Solution

Run the following commands in order (mirrors `.github/workflows/build.yml` and `CLAUDE.md`):

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

Focus points during execution:

- `check:circular-dependencies` — the new `import type { ImageBundlePlugin }` in `CellsMixin.ts` creates a new cross-folder link (`mixin/` → `plugin/`). Since it is type-only, it should erase at compile time and not introduce a cycle. If a cycle is reported, investigate whether keeping the import type-only is enough or whether the plugin type needs to move to a shared types file.
- `build-all-examples.bash` — shakes out any example package that relied on `graph.imageBundles` or the three removed methods. If an example breaks, update it to use the plugin-based API.
- Coverage — the new `ImageBundlePlugin.test.ts` (Task 6) should lift coverage on the three methods that were previously uncovered in `ImageMixin`.

Once all commands pass:

- Stage everything touched by Tasks 2–8 in a single commit with subject `refactor!: convert ImageMixin to ImageBundlePlugin` and a body reproducing the five "Breaking Changes" items from `plan.md`. The `!` marker signals the breaking change.
- Verify `git log --oneline` shows exactly two commits on the branch ahead of `main`: Task 1 (the `test(graph): characterize ...` commit) followed by this `refactor!: ...` commit.

## Dependencies

- Tasks 2 through 8 (all source, test, and documentation changes must be complete before validation).

## Context

- CI command sequence: `CLAUDE.md` → "CI Validation" section.
- Example package entry points: `packages/ts-example-selected-features/`, `packages/ts-example/`, `packages/ts-example-without-defaults/`, etc. — shake out via `./scripts/build-all-examples.bash`.
- Commit message conventions: `.claude/rules/git/commit-conventions.md` — `type(scope): subject`, imperative, lowercase, <72 chars, body wrapped at 120 chars, no `Co-Authored-By`, no emojis. `!` suffix for breaking changes.
- Breaking change content to reproduce in the commit body: `plan.md` → "Breaking Changes" → five numbered items.

## Success Criteria

- All nine CI commands pass locally.
- The branch `refactor/migrate-image-mixin-to-plugin` contains exactly two commits ahead of `main`:
  - `test(graph): characterize CellsMixin.postProcessCellStyle` (Task 1)
  - `refactor!: convert ImageMixin to ImageBundlePlugin` (Tasks 2–8)
- `git status` reports a clean working tree.
- No circular dependencies reported.
- Coverage did not regress on bundle-related code paths.
- Ready to open the PR.
