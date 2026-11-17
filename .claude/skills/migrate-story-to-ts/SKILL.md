---
name: migrate-story-to-ts
description: "Migrate one JavaScript Storybook story of packages/html/stories to TypeScript, check it against its mxGraph example and its history, describe it for the user, and verify it in a browser. Use when the user asks to migrate a story to TypeScript, or names a story of the issue tracking the migration of the JavaScript stories."
argument-hint: "<StoryName>"
---

# Migrate a Storybook story to TypeScript

One story per branch and per pull request: the tracking issue,
[#1035](https://github.com/maxGraph/maxGraph/issues/1035), requires the migration to be incremental. It lists the
remaining stories with a difficulty estimate, and is ticked with the pull request number once merged.

The stories were converted from the mxGraph examples in 2021 and were neither type checked nor linted until late 2026.
Many still carry conversion bugs that only show when a given button or gesture is used. Expect the migration to find
some, and fix them in the same pull request: a TypeScript story that does not work is not a finished migration.

## 1. Read before writing

Three sources, all read before the first edit:

- **The JavaScript story**, `packages/html/stories/<Name>.stories.js`.
- **Its history**, `git log --follow --format='%h %ad %s' --date=short -- packages/html/stories/<Name>.stories.js`.
  Read the message of every commit after the 2021 conversion. Some of them fixed a bug on purpose, and their fix must
  survive the migration, even when it diverges from mxGraph. Example: `81aa8d732` (#1277) moved the cache invalidation
  of HtmlLabel from `setValue` to `valueForCellChanged`, which the mxGraph example gets wrong.
- **The mxGraph example**, `javascript/examples/<name>.html` in a clone of `jgraph/mxgraph` (archived, no fetch
  needed). Identify the clone by its remote, see `.claude/rules/tooling/upstream-clones.md`. The file name is usually
  the lowercase story name, `htmllabel.html` for `HtmlLabel`. Its header comment is the description of the example.

Then list, for the summary to the user, every difference between the story and the example, and classify each one:
**adapted on purpose** (an API that changed, a fix recorded in the history, a Storybook constraint such as the buttons
appended to the story element rather than to `document.body`), or **missing** (to restore, or to ask about).

## 2. Migrate

`git mv` the file to `.ts` first, so that git has a chance to show the rename. It only does when less than half the file
changes, which is rare once the code is cleaned up, so do not rely on it.

### Shape of the file

Follow a recent migration rather than an old one, they improved over time. `PortRefs.stories.ts`,
`OrgChart.stories.ts` and `HtmlLabel.stories.ts` are good references.

- `const Template = ({ label, ...args }: Record<string, string>) => { ... }`, and `export const Default = Template.bind({});`.
- Import types with `type` (`type Cell`, `type EventObject`), import the shared helpers with their `.js` suffix
  (`./shared/args.js`, `./shared/configure.js`).
- Describe the story with `createMainDiv(...)`, see [step 3](#3-describe-the-story).
- Apply `.claude/rules/architecture/graph-api-usage.md`: object form of `insertVertex` and `insertEdge`, no `parent`
  argument for the default parent. Wrap several model changes in `graph.batchUpdate(...)`.
- Plugins: `graph.getPlugin<ConnectionHandler>('ConnectionHandler')!`. When the story passes an explicit plugin list,
  check whether it is still needed or only reproduces `getDefaultPlugins()`.
- Event listeners: `(_sender: any, evt: EventObject) => ...`.
- Loops: `for...of`, except loops on `getChildCount()`/`getChildAt()` and similar accessors, which stay indexed.
- Descriptive names: `obj`, `elt`, `cstr`, `v1` inherited from mxGraph become `userObject`, `updatedValue`...

### Overriding graph members

This is where most of the time goes. The rules are in the
[A graph class](https://maxgraph.github.io/maxGraph/docs/guides/extend-maxgraph#a-graph-class) section of the extend
guide, `packages/website/docs/guides/extend-maxgraph.md`. Read it rather than guess, an earlier session got it wrong.

- **Mixin members** (`cellLabelChanged`, `getEditingValue`, `isCellEditable`...) are declared as properties holding a
  function. A subclass overrides them as a property initialized with an arrow function, and `super.member(...)` works
  since the mixin installs them on the prototype. Overriding them as a method fails with TS2425.
- **Accessors `AbstractGraph` declares itself** (`getContainer`, `getPlugin`...) are class fields: override them as a
  property too, but `super` is rejected (TS2855). Read the underlying state instead.
- **Real methods** (`convertValueToString`, the `create*` factories of `Graph`) are overridden as methods.
- `packages/html/tsconfig.json` sets `useDefineForClassFields`, so a property override is installed once `super()` has
  returned: it is not active while the base constructor runs. Only a method override is.
- Patching the instance (`graph.isCellEditable = function (cell) {...}`) is still fine for a one-off, as in
  `UserObject.stories.ts`. When the story already has a graph subclass, keep the overrides in it.
- A signature that is narrower than what the code accepts needs a cast with a comment. `convertValueToString` returns
  a `string`, but the label rendering accepts a DOM node, so HtmlLabel returns `labelDiv as unknown as string`.

### Conversion bugs to look for

Each of these was found in a migrated story. Check for all of them.

| Pattern | Why it breaks | Seen in |
|---|---|---|
| `fn.apply(this, arguments)` after reassigning a parameter | Reassigning a parameter only updates `arguments` in sloppy mode, not in a strict class method. Pass the parameters explicitly | HtmlLabel (#1277) |
| A cache cleared in `setValue` only | Undo and redo bypass `setValue` and call `valueForCellChanged`. Clear the cache there | HtmlLabel (#1277) |
| A call to, or an override of, an mxGraph method that no longer exists | Lint does not flag it, the feature silently does nothing or throws once used. Check that the member exists in `packages/core/src` | SecondLabel (`isCellVisible`), OrgChart (`Graph.traverse`) |
| A global prototype mutation (`Shape.prototype.getPorts = ...`) or a global registry change (`CodecRegistry.getCodec(Cell).exclude.push(...)`) | It leaks into every story displayed afterwards in the same page. Use a subclass, a style key, or state local to the story (a `WeakMap`) | PortRefs (#1129), HtmlLabel |
| Data bolted onto an object through `as any` | The class often has a typed field for it already (`ConnectionConstraint.name`) | PortRefs (#1129) |
| Dead branches behind a hardcoded flag (`const cached = true`) | Unreachable code to maintain and type. Drop the flag | HtmlLabel |
| A bare `new KeyHandler(graph)` | Not useless: it is the only caller of `graph.escape()`, which cancels a move, connection or resize. Keep it with a comment, `// NOSONAR` (rule S1848), and `createGraphContainer(args, { captureKeystrokes: true })` so that it receives the keys in Storybook | OrgChart (#532), #1326 |
| A container with no size when the story runs | The story element is not attached yet. Defer what needs the size | OrgChart (#532) |

A missing export or a type too narrow in `@maxgraph/core`, found while typing the story, is fixed in the core in its own
commit, as DragSource (#860), Thread (#877) and Stylesheet (#878) did.

## 3. Describe the story

The description shown above the graph says what the story demonstrates **and what to try**: which gesture, which
button, and what to observe. The mxGraph header alone is rarely enough, "connected to the state of the user object"
told the user nothing about the checkbox of HtmlLabel.

- Start from the mxGraph header comment, then add the interactions.
- Up to 5 lines: keep it in `createMainDiv(...)`, lines separated by `<br>`.
- Beyond that: move the details to a `<Name>.mdx` file next to the story, on the model of `OrgChart.mdx` (a `Meta` block
  importing the story, a title, the description, then a `## What you can do` list), and keep one short sentence in the
  story.

## 4. Verify

```bash
(cd packages/html && npx tsc --noEmit)      # the whole stories folder
npx eslint packages/html/stories/<Name>.stories.ts
npx prettier --check packages/html/stories/<Name>.stories.ts
```

Then run the story. `npm run dev -w packages/html` serves Storybook on port 8901, which needs a fresh build of
`packages/core/lib`. The story id is derived from its `title:`, see the Storybook section of
`.claude/rules/documentation/website.md`: `Labels/HtmlLabel` gives `labels-htmllabel--default`, opened directly at
`http://localhost:8901/iframe.html?id=<id>&viewMode=story`.

Exercise every interaction the description announces, plus undo/redo when the story has an `UndoManager`, and collect
the page errors and the failed requests. Without browser tools in the session, `playwright-core` installed in the
scratchpad (never in the repository) with a cached Chromium under `~/.cache/ms-playwright` does the job. Headless
Chromium does not reproduce every focus issue: keyboard handling still needs a manual test, so ask the user for one
when the story has a `KeyHandler`.

## 5. Commit and pull request

- `refactor(stories): migrate <Name> to TypeScript` when the behaviour is unchanged.
- `fix(stories): ...` naming the user-visible fix when the migration repairs the story, as OrgChart did
  (`fix(stories): make the OrgChart story work as in mxGraph`).
- The body explains each non-obvious change: a removed global mutation, a fixed conversion bug, a deliberate divergence
  from mxGraph. The commit messages of the migrations below are the model.
- The pull request description links #1035 with `Part of #1035`, never a closing keyword, since the issue stays
  open. Once merged, tick the story in #1035 with the pull request number.

## Previous migrations

| Story | Pull request | Commit | What it teaches |
|---|---|---|---|
| OrgChart | [#532](https://github.com/maxGraph/maxGraph/pull/532) | `14b5f2758386949665390909caf24b1fdb3d3e3b` | The complex case: a story that never worked, container sized after attachment, KeyHandler kept, interactions restricted to what the example shows, a `.mdx` page |
| PortRefs | [#1129](https://github.com/maxGraph/maxGraph/pull/1129) | `d19ad65e594d4644cbc0d5adf27ec705f817efca` | Four global prototype mutations replaced by subclasses and a style key, a misplaced port fixed, `as any` removed |
| HelloWorld | [#984](https://github.com/maxGraph/maxGraph/pull/984) | `5da20d234d7d0bad29dcefa004c7b6522eeb24b6` | A simple one, and a tutorial page of the website that shows the story code, updated with it |
| Guides | [#908](https://github.com/maxGraph/maxGraph/pull/908) | `896a8e55dbaab98379efde57520783ed4a424fe5` | Core types fixed along the way, known problems left for later and said so in the commit |
| Stylesheet | [#878](https://github.com/maxGraph/maxGraph/pull/878) | `dd72497d751aa0b53ff5c8b89946ec4c6735815b` | Object form of the insert methods, a core signature widened to accept nullish values |
| Thread | [#877](https://github.com/maxGraph/maxGraph/pull/877) | `67320e84f60e9aef806628ba8295c4abf6e77917` | A description added for the user, a missing feature (overlay tooltip) restored |
| DragSource | [#860](https://github.com/maxGraph/maxGraph/pull/860) | `e2f84b0ca00bd6b1514a51642abd6d757d3c7192` | A type of the public API exported because the story needed it |

Before the migration, `81aa8d732558e6d5c67107b0bb8ce5835aee1934` ([#1277](https://github.com/maxGraph/maxGraph/pull/1277))
repaired four JavaScript stories and documents the conversion bugs of the table above.
