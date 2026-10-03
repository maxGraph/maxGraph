# Guides Structure

Applies to the pages of `packages/website/docs/guides/`. The other documentation sections are unaffected: `manual/`
explains concepts, `tutorials/` teaches the basics, `usage/` documents each feature, and a guide walks a reader through
one complete task.

## Open a linear task with its prerequisites, and nothing else

A guide that is a **linear task**, such as
[`reduce-bundle-size.md`](../../../packages/website/docs/guides/reduce-bundle-size.md), opens with a
`## Before you start` block placed right after the goal of the guide:

- at most **four** bullets;
- only **hard gates** and things to have at hand: a minimum version, a build that runs, a tool to install, an inventory
  to collect. Each bullet is an action the reader can check off, not a reading assignment;
- at most **two** links;
- then **one sentence** naming the knowledge the guide assumes, with a link to the page that covers it.

A guide that is a **collection of independent recipes**, such as
[`extend-maxgraph.md`](../../../packages/website/docs/guides/extend-maxgraph.md), gets no such block. Its readers land in the
middle of it from a search rather than reading it top to bottom, so a checklist would be noise. State the audience in
one sentence in the introduction instead, and link each concept where it is first used.

## Never turn the prerequisites into a bibliography

Listing every page a guide touches is the failure mode to avoid. For the tree-shaking guide that list would have held
around ten pages, which reads as "read the whole Usage section first": discouraging, and false, since the reader needs
none of them in full.

The distinction that settles what goes up front:

| | Where it belongs |
|---|---|
| **Hard gate**, the guide fails without it | The `## Before you start` block |
| **Background concept**, the reader can pick it up on the way | A link at the point of use, inside the step that needs it |

A version requirement is a hard gate and must be verified in the sources rather than assumed: the tree-shaking guide
requires 0.25.0 because its step 2 uses `registerDefaultStyleElements`, which carries `@since 0.25.0`. State it once:
that guide does it in a single preamble sentence rather than in a bullet, because the whole page documents that version
and no earlier one, and repeating it in the block would say the same thing twice.

## State one version, never speculate about earlier ones

A guide names the version it was written and verified with, and stops there. `configure-basegraph.md` published
"Nothing on this page needs that version in particular, so it may well apply to earlier ones, which have not been
checked", which is the shape to avoid: an unverified compatibility claim is still a claim, so every reviewer checks
it, and it survived four review rounds before being removed. Write `Earlier versions are not covered` instead.

A feature that genuinely needs a given version says so at the point of use, `Since 0.25.0`, which is checkable
against the `@since` tag in the sources and therefore earns its keep. `extend-maxgraph.md` carries three of those.
It is the page-level claim to drop, not the per-feature one.

## Write the title as the outcome, not the mechanism

A page inside a section already called Guides does not repeat `Guide:` in its title, and it is named after what the
reader gets rather than after the machinery: `Reduce the Bundle Size of an Application`, not
`Improving the Tree-Shaking of an Application Using Graph`. Check that the title still covers the whole content, the
previous one announced an application using `Graph` although one of its steps applies to `BaseGraph` as well.

The file name follows a rule of its own, a verb first for a guide, see
[Name a new page after its section's convention](./website.md).
