# Tasks: XML deserialization must produce real booleans

## Overview

Make the XML decoders produce real booleans where the types declare them, on all three decode paths and for every
codec-registered class, without changing the XML format, which stays on 1 and 0. Full reasoning in `../plan.md`,
evidence in `../explore.md` and `../raw/`.

Task files describe WHAT and WHY. The HOW, including every file and line, lives in `../plan.md`; do not restate it
here, read both.

## Task list

- [x] **Task 01**: Shared fixture for the boolean property matrix, `task-01.md`
- [x] **Task 02**: Characterize the mxGraph style string path, `task-02.md` (needs 01)
- [x] **Task 03**: Characterize the native XML attribute path, `task-03.md` (needs 01)
- [x] **Task 04**: Characterize the stylesheet path, `task-04.md` (needs 01)
- [x] **Task 05**: Characterize the boolean fields of the codec-registered classes, `task-05.md` (needs 03, same file)
- [x] **Task 06**: Foundations for boolean-aware decoding, `task-06.md` (needs 02, 03, 04, 05 green and committed)
- [x] **Task 07**: Boolean-aware decoding in the generic attribute decoder, `task-07.md` (needs 06)
- [x] **Task 08**: Boolean-aware decoding in the mxGraph style string parser, `task-08.md` (needs 06)
- [x] **Task 09**: Boolean-aware decoding in the stylesheet codec, and its dropped values, `task-09.md` (needs 06)
- [x] **Task 10**: Flip the expectations and land the decode fix, `task-10.md` (needs 07, 08, 09)
- [x] **Task 11**: Align the two encoders that emit the words true and false onto 1 and 0, `task-11.md` (needs 09)
- [x] **Task 12**: Registration API for custom boolean cell style properties, `task-12.md` (needs 06, 10)
- [ ] **Task 13**: Extending guide, and links from the codec and configuration pages, `task-13.md` (needs 12, 15)
- [ ] **Task 14**: Record the decision and rule on the changelog, `task-14.md` (needs 12)
- [ ] **Task 15**: Decide and handle the child element form of a style value, `task-15.md` (BLOCKED, see below)

## Execution order

1. **Task 01 alone.** Everything test-side depends on it.
2. **Tasks 02, 03 and 04 in parallel**, then **05** after 03 since they share a file. Commit here: the suite must be
   green against the unfixed source, and no source file may be modified. This is the characterization commit.
3. **Task 06 alone**, after that commit. It adds the foundations and changes no behaviour, so the suite stays green.
4. **Tasks 07, 08 and 09 in parallel**, then **10**. The suite is RED between 07 and 10, which is expected: those four
   tasks form ONE commit, landed only when 10 brings it back to green.
5. **Task 11** after 09. It can share the commit with 10 or be its own; the constraint is only that it must not land
   before 09, since aligning the stylesheet output makes the discarding guard reachable for booleans.
6. **Task 12**, then **14** and **13** in parallel, with 13 also waiting on the answer to task 15.

## Blocked, and what it blocks

**Task 15** waits on open decision 3 in `../plan.md`: whether to route the child element form of a style value through
the same conversion. If it is routed, it belongs in the same commit as task 07. Either way its outcome must be stated
in the limits section of the guide, so task 13 cannot be finished before the answer.

## The other two open decisions

Neither blocks a task, both change how one is done:

- Whether any surviving type suppression uses the form the compiler flags as unused once the value becomes a boolean.
  Affects tasks 03 and 10. Default if unanswered: keep the repo's current form.
- Whether the hardcoded word in the graph view codec is aligned too. Affects task 11. Default if unanswered: leave it
  and say so in the pull request.

## Commit boundaries

Four groups, not fifteen commits, except that the characterization group is committed task by task since each of its
tasks leaves the suite green on its own:

1. characterization, tasks 01 to 05, one commit per task
2. the decode fix, tasks 06 to 10, plus 15 if it is routed
3. the encoder alignment, task 11
4. the registration API with its documentation and the decision record, tasks 12 to 14

## Definition of done for the whole set

- No `FIX should be` marker remains anywhere under `packages/core/__tests__`.
- Adding a boolean property to the style interface without listing it fails the build.
- The byte-identical round trip test still passes, proving the XML format did not change.
- Full CI as listed in `CLAUDE.md` passes: build, `test-check`, tests with coverage, ts-support, the examples script,
  the html build, the circular dependency check, lint and the package check.
