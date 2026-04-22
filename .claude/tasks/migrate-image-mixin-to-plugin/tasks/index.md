# Tasks: Migrate ImageMixin to ImageBundlePlugin

## Overview

Migrate `ImageMixin` to a standalone `ImageBundlePlugin` in `packages/core`. This is the proof-of-concept for the larger mixin-to-plugin migration. The plugin owns `imageBundles` and the three bundle methods; `CellsMixin.postProcessCellStyle` routes through `graph.getPlugin<ImageBundlePlugin>('image-bundle')`. Breaking change — `Graph` continues to work by default (plugin in `getDefaultPlugins()`); `BaseGraph` users must opt in.

The branch already contains the `chore: add EPCT plan …` commit. The plugin id naming convention rule landed on `main` via PR #1049 and was dropped from this branch during rebase (no-op). Remaining work divides into **two commits** on this branch, grouped as follows:

- Task 1 → Commit A: `test(graph): characterize CellsMixin.postProcessCellStyle` (pre-refactor characterization, no source change).
- Tasks 2–9 → Commit B: `refactor!: convert ImageMixin to ImageBundlePlugin` (all source changes + test adjustments + JSDoc + CHANGELOG + CI validation, bundled in one atomic commit).

## Task List

- [ ] **Task 1**: Add characterization tests for `CellsMixin.postProcessCellStyle` — `task-01.md`
- [ ] **Task 2**: Create the `ImageBundlePlugin` class — `task-02.md` (depends on Task 1 being committed)
- [ ] **Task 3**: Register `ImageBundlePlugin` as a built-in plugin — `task-03.md` (depends on Task 2)
- [ ] **Task 4**: Reroute `CellsMixin.postProcessCellStyle` through `getPlugin()` — `task-04.md` (depends on Tasks 2, 3)
- [ ] **Task 5**: Remove `ImageMixin` and move `imageBundles` storage to the plugin — `task-05.md` (depends on Tasks 2, 3, 4)
- [ ] **Task 6**: Add dedicated unit tests for `ImageBundlePlugin` — `task-06.md` (depends on Tasks 2, 5)
- [ ] **Task 7**: Update JSDoc on `ImageBundlePlugin`, `CellStateStyle.image`, `ImageBundle`, and `CellsMixin.postProcessCellStyle` — `task-07.md` (depends on Tasks 2, 5)
- [ ] **Task 8**: Document the breaking changes in `CHANGELOG.md` — `task-08.md` (depends on Task 5)
- [ ] **Task 9**: Run the full CI validation sequence and finalize the refactor commit — `task-09.md` (depends on Tasks 2–8)

## Execution Order

### Commit A (standalone, no source changes)

1. **Task 1** — commit it immediately. This is the characterization commit. After this task, `git log` shows one new commit on the branch.

### Commit B (atomic refactor — do not split)

Execute Tasks 2–8 in a single working session without committing between them. The codebase is only guaranteed to compile after all of them are done. Task 9 runs CI and produces the single commit.

Within Commit B, the ordering is:

1. **Task 2** — create the plugin class in isolation. Build stays green (nothing wired yet).
2. **Task 3** — register the plugin (barrel + `getDefaultPlugins()` + `BuiltinPluginId`). Build stays green. Tasks 2 and 3 are tightly coupled but kept separate for review clarity.
3. **Task 4** — reroute `CellsMixin`. Build stays green, but runtime image-bundle resolution is transiently broken (see Task 4 notes). This is fine inside the same commit as Task 5.
4. **Task 5** — delete `ImageMixin`, remove `imageBundles` from `AbstractGraph`, update the two affected tests. The atomic breakage. Build green again after this task.
5. **Task 6** — add `ImageBundlePlugin.test.ts`.
6. **Task 7** — JSDoc updates (parallel with Task 6 — they touch different files).
7. **Task 8** — `CHANGELOG.md` update (parallel with Tasks 6 and 7).
8. **Task 9** — full CI sequence, then create the single `refactor!` commit bundling Tasks 2–8.

### Parallelizable within Commit B

- Tasks 6, 7, 8 touch disjoint files and can be done in any order once Task 5 is complete.
- Tasks 2 and 3 could technically be combined into one step if wished — kept separate for easier review.

### Not parallelizable

- Task 1 must be committed before anything in Commit B starts (the characterization tests must exist on the branch history before the refactor modifies anything).
- Tasks 2 → 3 → 4 → 5 must be sequential inside Commit B (dependency chain).
