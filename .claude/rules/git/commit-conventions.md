---
paths:
  - "**"
---
# Commit Message Conventions

Format: `type(scope): subject` — imperative mood, <72 chars, lowercase, no period.

## Types

feat, fix, refactor, chore, docs, test, perf, style

Use `!` suffix for breaking changes: `refactor!: move getViewXml from xmlUtils to xmlViewUtils`

## Scopes

docs, deps-dev, deps-gha, typescript, or component names (graph, layout, serialization)

## Body

- Wrap at 72 characters
- Explain "why" not "what"
- Use bullet points for multiple items

## Examples

```
chore(deps-gha): bump actions/setup-node from v4 to v6
```

```
feat: allow to pass more null and undefined to Multiplicity

- Update type signatures to accept nullish values
- Add tests for null/undefined handling
```
