# Website Documentation

Applies to every change under `packages/website/docs/`. See
[`guides-structure.md`](./guides-structure.md) for the structure of the pages of the `guides/` section.

## The build is the verification, run it

```bash
npm run build -w packages/website
```

`packages/website/docusaurus.config.ts` sets both `onBrokenLinks` and `onBrokenAnchors` to `throw`, so a relative link
to a missing page and an anchor matching no heading both fail the build instead of shipping silently. A documentation
change is not finished until that command succeeds.

Three traps it catches, all met in practice:

- **A colon followed by a space in an unquoted frontmatter `description` breaks the YAML parsing.** Write
  `description: 'How-to extend maxGraph: override existing behavior'` with quotes, or drop the colon. Without them the
  build fails on "incomplete explicit mapping pair".
- **A heading whose slug collides with the page title gets a numeric suffix.** `usage/graph.md` carries both a
  `# Graph` title and a `## Graph` heading, so `#graph` resolves to neither. Link the page without an anchor rather
  than guessing the generated suffix.
- **Moving a page invalidates the links that target it**, including those written from repository files such as
  `README.md` and the ADRs under `docs/adr/`, which the Docusaurus build does not check. Grep the whole repository for
  the old path, not only `packages/website`.

## Redirect a moved page, but know that an anchor cannot be redirected

A page that has already been published keeps its URL alive through `@docusaurus/plugin-client-redirects`, configured in
`docusaurus.config.ts`. Add a `{ from, to }` entry when you move such a page.

Two limits to keep in mind rather than discover:

- `from` is validated as a **pathname**, and a browser never sends the `#fragment` to the server, so a deep link to a
  section inside a page cannot be redirected. Moving a section out of a page silently drops every published link to its
  anchor. Preserve the slug with a stub heading, or accept the loss deliberately.
- A `from` pointing at a page that still exists is discarded by the plugin, so there is nothing to add when the page
  itself does not move.

A page introduced on the same branch has never been published and needs no redirect.

## Name a new page after its section's convention

The file name is the published URL, so it is chosen once and changed at a cost.

- `guides/` holds tasks, so a file name **starts with a verb**: `reduce-bundle-size.md`, `migrate-from-mxgraph.md`,
  `configure-basegraph.md`. A gerund is not a verb for this purpose, `extending.md` became `extend-maxgraph.md`, and
  neither is a noun that looks like one, `setup` being the noun of `set up`.
- every other place, `usage/`, `manual/`, `tutorials/`, `development/` and the pages at the root of `docs/`, names a
  subject rather than a task, so a file name is **a noun, in the singular**: `usage/graph.md`, `development/release.md`.
  A compound noun is fine as long as each word stays singular: `usage/tree-shaking.md`, `usage/edge-style.md`,
  `development/issue-triage.md`, `development/release-process.md`. Prefer the noun over the gerund when both exist,
  `issue-triage.md` rather than `issue-triaging.md`. The pages that predate this rule keep their name, plural or
  gerund, such as `usage/plugins.md`, `manual/cells.md`, `known-issues.md` or `development/contributing.md`; it
  applies to new pages.

Keep the file name and the `# title` naming the same thing. `improve-tree-shaking.md` was titled
`Reduce the Bundle Size of an Application` and was renamed `reduce-bundle-size.md` for that reason, while it was still
unpublished. A page renamed after publication keeps its old URL alive with a `{ from, to }` entry, see the section
above; a page introduced on the branch that publishes it can be renamed freely.

## Build a Storybook demo link from the story title

Demo links follow `https://maxgraph.github.io/maxGraph/demo/?path=/story/<id>`, with
`id = sanitize(title) + '--' + sanitize(storyName)`.

`sanitize` lowercases, then replaces with `-` every character of a punctuation class, collapses the runs and trims.
That class holds the space, the usual ASCII punctuation and, notably, **the underscore**, plus the typographic quotes
and the unicode dashes. Every story of `packages/html/stories` exports a single `Default`, so every id ends in
`--default`.

Derive the id from the `title:` field of the story itself, never from the file name, and pair the demo link with a
source link, as the existing pages do:

```markdown
- live demo: [Shape](https://maxgraph.github.io/maxGraph/demo/?path=/story/shapes-shape--default)
- source code: [Shape.stories.js](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Shape.stories.js)
```

Three published links were broken by ignoring this:

| Trap | Wrong | Right |
|---|---|---|
| The underscore is sanitized like the other punctuation | `icon_images-imagebundle--default` | `icon-images-imagebundle--default` |
| The `/demo/` path segment is mandatory | `maxGraph/?path=/story/...` | `maxGraph/demo/?path=/story/...` |
| A renamed story changes its id | `perimeters--perimeter-various-implementations` | `styles-perimetervariousimplementations--default` |

The Docusaurus build does not check these links, since they are external. Check the `title:` of the story before
writing one.
