# Analysis 003: Claude Code subagents for the repository

- **Date**: 2026-10-27
- **Analysis basis**: commit `6a2cebcf579556b183d86e210707c665affa45b8` on `main`, after version 0.25.1, for the
  state of the repository before any agent was added. The agents described below are those added by the pull request
  that adds this analysis
- **Question**: which Claude Code subagents are worth sharing in the repository, under `.claude/agents/`, so that
  every contributor gets the same ones, and which model should each run on?
- **Related**: [Claude Code subagents](https://code.claude.com/docs/en/sub-agents),
  [skills](https://code.claude.com/docs/en/skills) and [hooks](https://code.claude.com/docs/en/hooks) documentation,
  [analysis 001](001-extract-SelectionMixin-to-plugin.md), [analysis 002](002-extract-PanningMixin-to-plugin.md)

## Summary

| Agent | Kind | Model | Status |
|---|---|---|---|
| `build-runner` | runs commands | Haiku | added, validated |
| `review-correctness`, `review-architecture`, `review-tests`, `review-docs`, `review-security` | read-only | Sonnet | added, validated by a seeded test |
| `mixin-extraction-analyst` | read-only | Opus | added, validated on one mixin |
| `mxgraph-archaeologist` | read-only | Sonnet | candidate |
| `bundle-impact-analyst` | runs builds | Sonnet | candidate |
| `issue-triager` | read-only, reads GitHub | Sonnet | candidate |
| `call-site-migrator` | edits files | Sonnet | candidate, lowest confidence |

A subagent pays off when a task produces output nobody needs in full, such as a build log, a whole-diff review or a
repository-wide inventory, and only its conclusion matters. That rule ranked the candidates. The first three are added;
the other four are left for later.

## Before this analysis

- Rules under `.claude/rules/` (architecture, testing, documentation, git, tooling), read by every session.
- Skills: `build`, `test`, `lint` and `ci` asked the main agent to launch a subagent with an inline prompt, which ran
  as `general-purpose` with every tool loaded; `pr-bundle-size` and `prepare-release`.
- A `PreToolUse` hook, `.claude/hooks/block-build.sh`, meant to warn when a heavy npm command runs in the main context.
- No agent under `.claude/agents/`.

## Claude Code facts this relies on

Checked against the documentation linked above on 2026-10-14, then in practice.

- **Same name, the project agent wins** over an agent of the same name defined in a user's own configuration. Inside
  this repository, the project versions are the ones used.
- **A skill can run inside an agent** with `context: fork` and `agent: <name>` in its frontmatter. The forked agent
  does not see the conversation, so the skill text must be self-contained, and it runs in the background.
- **`tools:` is an allowlist**, and it also excludes the MCP tools. Tool schemas are the largest part of the startup
  cost of an agent, which every one of its calls pays again, so a small toolset makes each call cheaper.
- **Claude Code watches `.claude/agents/`.** An added or edited agent is used at the next delegation, with no
  restart. A restart is still needed when the directory did not exist when the session started, for the `agents`
  directory of a folder added with `--add-dir`, and in a session started with `--disable-slash-commands`.
- **A subagent is not allowed to write a report file.** The harness refuses it with "Subagents should return findings
  as text, not write report files". An agent producing a document returns it as text, and the caller writes it.
- **Hooks**: Claude never sees the stderr of a `PreToolUse` hook exiting 0; `hookSpecificOutput.additionalContext` is
  what reaches the model without blocking the command. A hook firing inside a subagent receives `agent_id` and
  `agent_type` in its JSON input. No `CLAUDE_AGENT_NAME` variable exists.

The last point showed that `block-build.sh` never reached the model: it wrote to stderr, it skipped subagents through
`CLAUDE_AGENT_NAME`, its skip list matched `ls` anywhere in the command, so any path containing `Utils` or `tools`
disabled it, and its pattern missed commands prefixed by the nvm setup. It is fixed alongside the agents.

## How the model was chosen

The model sets both the cost of every call and the quality of the conclusion, so each agent gets the cheapest model
that can produce the part of its output that matters.

| Agent | Model | What the output needs | Cost per run, measured |
|---|---|---|---|
| `build-runner` | Haiku | run a command, then report a verdict and the first error | about 30k tokens per command, 47k for the 9 steps of `/ci` |
| review lenses | Sonnet | read a whole diff and its context, judge what is a defect | 36k to 38k tokens per lens, about 25 s per lens, measured |
| `mixin-extraction-analyst` | Opus | options, risks and a recommendation weighed against three ADRs | 156k tokens, 48 tool calls, 8.5 min |

- **Haiku for `build-runner`.** The work is mechanical, and the only risk is a bad summary of a compiler or test
  error. The agent therefore quotes the first error verbatim rather than paraphrasing it. On a test broken on purpose,
  it reported the Jest diff with its `file:line`.
- **Sonnet for the lenses.** A review reads a lot and needs judgement, but each lens looks at one concern only, and
  five of them run in parallel on every review, so Opus would multiply the cost for each pull request.
- **Opus for the analyst.** The inventory is mechanical, but the value of the analysis is in the options and the
  recommendation, which must agree with ADR 0001 to 0003. It runs a few times a year, so the higher cost per run is
  acceptable.

## The agents added

### `build-runner`

`tools: Bash, Read`. The `build`, `test`, `lint` and `ci` skills now run inside it with `context: fork`, and
`prepare-release` delegates the examples build to it. It holds what the four skills used to repeat: run from the
repository root, use the Node version of `.nvmrc`, a 600 s timeout per command, one command per call, never edit a
file nor retry, report the verdict, the first error verbatim and the duration.

When a command fails, it compares the installed version of the failing tool with `package-lock.json`. That came from
a `/build` run which failed with `TS5095` because `node_modules` held TypeScript 5.9.3 while the lock file pins 6.0.3:
the agent reported the error correctly, but could not name the stale install as the cause.

Validation: `/lint`, `/test <file>`, `/build` and `/ci` all ran through the agent; the 9 steps of `/ci` passed, the
longest being the Jest run with coverage at 287 s, measured, under the timeout.

### Five review lenses

`tools: Glob, Grep, Read, Bash`. Each lens follows a generic review method for its concern, then a `maxGraph checks`
section of 4 or 5 checks phrased as things to hunt, each pointing at the rule that holds the detail:

| Lens | maxGraph checks |
|---|---|
| correctness | truthiness on a value that can be `0` or `''`, missing `batchUpdate`, `destroy()` cleanup, a plugin assumed to be present although `BaseGraph` registers none, divergence from mxGraph in ported code |
| architecture | eager imports pulled into `AbstractGraph`, `import type`, zero runtime dependency, public API and `@since`, plugin id naming, TypeScript 3.9 compatibility, shared utilities bypassed (`log()`, `translate()`, `parseXml()`) |
| tests | regression test for a fix, `test.each`, `ts-support`, object form of `insertVertex` |
| docs | Storybook demo id and `/demo/` segment, repository links pinned to a branch, `@since`, CHANGELOG policy, guide structure |
| security | labels rendered as HTML and `htmlEntities`, `parseXml`, `allowEval`, runtime dependencies |

A shared block tells each lens to read `CLAUDE.md` and the rules it names, and forbids the commands that saturate the
machine: `npm install`, the full coverage run, the CI sequence, the examples and Storybook builds.

Two other shapes were rejected. Restating the rules in each lens makes two sources of truth and a longer prompt paid on
every call. Pointing at the rules alone is not enough: in an earlier run, a docs lens told to read the rules skipped
the Storybook id check that `website.md` prescribes.

Validation: a seeded blind test on a throwaway branch with a neutral name, one defect per lens, the answer key kept
out of the repository. Every lens found its own seed:

| Seed | Lens | Severity given |
|---|---|---|
| `if (index)` instead of `!isNullish(index)`, so the handle at index 0 is dropped | correctness | Major |
| value import of `RubberBandHandler` in `AbstractGraph` | architecture | Major |
| a new test covering the true branch only, with the positional `insertVertex` | tests | Minor |
| a Storybook demo link without `/demo/` | docs | Major |
| `htmlEntities` dropped before a label reaches `innerHTML` | security | Blocker |

Limits: the seeds were written by the author of the checks, so they match those checks by construction. The run shows
the checks work, not that a lens without them would have missed these defects; a control run of the generic method on
the same branch was not done. One false positive came up: three lenses reported a hard-wrapped Markdown line as a
broken sentence.

### `mixin-extraction-analyst`

`tools: Glob, Grep, Read, Bash`, read-only. For one mixin of `AbstractGraph`, it inventories the members and their
callers in the core package, tests, stories, examples and website, reads ADR 0001 to 0003, compares the shapes of
analysis 001, and returns an analysis in the conventions of this directory. It sets the analysis basis to the full
SHA of `origin/main` and reads the code at that commit, states the command behind every count, and checks the state
of every issue it cites.

It does not measure bundle sizes: that means patching the sources and rebuilding the core package and an example,
which loads the machine. It writes the protocol and the patch of each variant, and leaves the figures as
`not measured yet` for the caller to run.

Validation: one run on `PanningMixin`, checked by hand: the counts rerun from the commands it states, the issue and
pull request states, and the fit of its recommendation with ADR 0003. The result is
[analysis 002](002-extract-PanningMixin-to-plugin.md), and its side finding became
[issue #1297](https://github.com/maxGraph/maxGraph/issues/1297). The run also showed that a subagent may not write a
report file, so the agent was changed to return the analysis as text.

## The remaining candidates

### `mxgraph-archaeologist`

A porting regression usually starts with "what did mxGraph do here?". This agent would compare a maxGraph class or
method with the mxGraph original and with its later version in draw.io, and trace when a behaviour changed:

- `jgraph/mxgraph` was archived on 2020-11-13, and jgraph kept developing mxGraph inside `jgraph/drawio`. That
  repository held only the minified mxGraph bundle `mxClient.js` until 22.0.0 (2023-09-28), when the mxGraph source
  code was first published under `src/main/mxgraph/`. It moved to `src/main/webapp/mxgraph/src/` in 24.2.7
  (2024-04-19), was removed in 24.8.6 (2024-11-19) and came back at that path in 28.2.0 (2025-09-05);
- the draw.io history is split around November 2024, and `git replace --graft` joins the two parts so that `git log`
  and `git blame` reach back to 2016. To verify before writing the agent: that both commits of the graft are reachable
  from public tags of `jgraph/drawio`;
- it would locate the clones through a documented convention, and ask before cloning.

The `PanningHandler.isActive()` regression of #1297 is the kind of question it answers.

### `bundle-impact-analyst`

The `pr-bundle-size` skill measures the size of the examples. This agent would explain a change: run `build:analyze`
on an example, compare the module lists between two refs, and name the import that pulled a module in. Useful a few
times per release, so a lower priority.

### `issue-triager`

It would follow the [issue triage page](../../packages/website/docs/development/issue-triage.md): reproduce from the
description when possible, look for duplicates and related pull requests, check whether `main` already fixes it, and
propose an Issue Type and a milestone. Read-only, it never writes to GitHub. Its value depends on the volume of issues:
it is mostly a skill-shaped workflow, and an agent only pays off when several issues are triaged in one go.

### `call-site-migrator`

Mechanical sweeps keep coming: the `for...of` migration was split over several pull requests, and
[issue #856](https://github.com/maxGraph/maxGraph/issues/856) still covers the positional `insertVertex` calls of the
stories. The agent would edit files, fanned out per folder. `isolation: worktree` branches from the default branch,
not from the current one, so the results would have to be gathered onto the sweep branch. Probably better as a skill
launching a general purpose agent with a precise prompt, unless sweeps share enough rules to justify an agent.

### Not proposed

- An agent per package or per folder: it splits by location rather than by output volume, and the lenses already
  read across folders.
- A `prepare-release` agent: the skill is interactive and needs the conversation, which a forked agent loses.
- A documentation writer: writing benefits from the context of the conversation, which a fresh agent rediscovers at a
  cost.

## Recommendation

Keep the three agents added: each replaces or formalises work that was already delegated, and each was validated on
real runs. Add the remaining candidates one at a time, starting with `mxgraph-archaeologist`, the only one answering a
recurring question that no skill covers.

## Proposed action plan

1. **Use the lenses on real pull requests** and record the defects they miss or invent, to replace the seeded test by
   evidence from real changes.
2. **Write `mxgraph-archaeologist`** after checking that the graft commits are public, and validate it on a known
   regression such as #1297.
3. **Reconsider `issue-triager` and `bundle-impact-analyst`** when a release or a batch of issues gives a real
   workload to try them on.
4. **Keep `call-site-migrator` as a skill** unless a second sweep with the same rules comes up.

## Method and limits

- The costs are the token counts and durations reported by Claude Code for each run, between 2026-10-14 and
  2026-10-26. They depend on the size of the change or of the mixin, and on the model version.
- Each validation is one run: one seeded test for the lenses, one mixin for the analyst. They show the agents work as
  designed, not how often they are right.
- The Claude Code behaviours listed above were checked on the version available in October 2026, and may change.
