---
paths:
  - "packages/core/__tests__/**"
  - "**/*.test.ts"
---
# Testing Conventions

- Tests use Jest with jsdom environment (configured in `packages/core/jest.config.cjs`)
- Tests are in `packages/core/__tests__/` mirroring `src/` structure
- Uses `@swc/jest` for fast TypeScript compilation
- Import paths in tests: omit `.js` extension (handled by moduleNameMapper)
- Use `test.each` (or `it.each`) when multiple tests share the same structure and only differ by input/expected data

```typescript
// Good — data-driven
test.each([
  ['case 1', input1, expected1],
  ['case 2', input2, expected2],
])('%s', (_desc, input, expected) => {
  expect(myFunction(input)).toBe(expected);
});
```

## Creating graphs

NEVER write `new Graph(...)` or `new BaseGraph(...)` in a test. Always go through the helpers of
`packages/core/__tests__/utils.ts`:

| Helper | Replaces |
|---|---|
| `createGraph(container?, model?, plugins?, stylesheet?)` | `new Graph(...)` |
| `createGraphWithoutContainer()` | `new Graph()` |
| `createGraphWithoutPlugins()` | `new Graph(undefined, undefined, [])` |
| `createBaseGraph(options?)` | `new BaseGraph(...)` |

They take the same arguments and return the same instances, they only register the graph so that the global
`afterEach` of `packages/core/__tests__/setup.ts` destroys it after the test.

That teardown is not cosmetic. A graph subscribes to `document` and to `window` the moment it is constructed, through
`GraphView.installListeners` and through its plugins (`SelectionHandler` keydown/keyup, `PanningHandler` mouseup,
`CellEditorHandler` resize), and only `destroy()` removes those subscriptions. An unregistered graph therefore stays
alive and listening for the rest of the file, where a later test dispatching a document event can reach it.

For a graph that genuinely cannot be built by a helper, construct it and pass it to `registerGraphForTeardown()`.

```typescript
// Good
const graph = createBaseGraph({ plugins: [FitPlugin] });

// Bad, never destroyed
const graph = new BaseGraph({ plugins: [FitPlugin] });
```

The invariant is that `new Graph(` and `new BaseGraph(` appear nowhere under `__tests__` outside `utils.ts`, which a
single grep checks.

### Never build a graph at module scope

A graph built outside a test body, typically in the argument table of a `test.each`, is created once when the module
loads and shared by every case. The teardown destroys it after the first one, and the next case runs against a dead
graph. Pass a factory and build inside the test.

```typescript
// Good
test.each([
  ['BaseGraph', createBaseGraph],
  ['Graph', createGraphWithoutPlugins],
])('%s', (_name, createTestGraph) => {
  const graph = createTestGraph();
});

// Bad, one shared graph, destroyed after the first case
test.each([
  ['BaseGraph', createBaseGraph()],
  ['Graph', createGraphWithoutPlugins()],
])('%s', (_name, graph) => {});
```

## Troubleshooting

- Build core package first: `npm run build -w packages/core`
- Module resolution issues: check `moduleNameMapper` in `packages/core/jest.config.cjs`
