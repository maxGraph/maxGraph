---
paths:
  - "**"
---
# Commit Message Conventions

Format: `type(scope): subject` — imperative mood, <72 chars, lowercase, no period.

## Types

feat, fix, refactor, chore, docs, test, perf, style

## Scopes

docs, deps-dev, deps-gha, typescript, or component names (graph, layout, serialization)

## Body

- Wrap at 120 characters
- Explain "why" not "what"
- Use bullet points for multiple items

## Breaking Changes

Add `!` after the type/scope AND a `BREAKING CHANGE:` footer (uppercase) at the end of the message, listing each break as a bullet.

Example:

```text
refactor!: convert ImageMixin to ImageBundlePlugin

Replace ImageMixin with a dedicated ImageBundlePlugin (id 'image-bundle'). Plugins are per-instance, opt-in on
BaseGraph, and keep AbstractGraph lean.

BREAKING CHANGE:
- AbstractGraph.addImageBundle, removeImageBundle, getImageFromBundles and the imageBundles property no longer
  exist on AbstractGraph, Graph, or BaseGraph. Migrate to
  graph.getPlugin<ImageBundlePlugin>('image-bundle')?.addImageBundle(bundle) and siblings.
- BaseGraph no longer ships image-bundle support by default; add ImageBundlePlugin to the plugins option to opt in.
```

## Examples

```
chore(deps-gha): bump actions/setup-node from v4 to v6
```

```
feat: allow to pass more null and undefined to Multiplicity

- Update type signatures to accept nullish values
- Add tests for null/undefined handling
```
