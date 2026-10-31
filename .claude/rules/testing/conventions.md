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

That teardown is not cosmetic. A graph subscribes to `document` the moment it is constructed, through
`GraphView.installListeners` (mousemove, mouseup, touchmove, touchend) and through its plugins (`SelectionHandler`
keydown/keyup, `PanningHandler` mouseup), and only `destroy()` removes those subscriptions. An unregistered graph
therefore stays alive and listening for the rest of the file, where a later test dispatching a document event can
reach it. There is one `window` listener too, the `resize` of `CellEditorHandler`, but it is installed on the first
call to `startEditing`, not at construction.

For a graph that genuinely cannot be built by a helper, construct it and pass it to `registerGraphForTeardown()`.

```typescript
// Good
const graph = createBaseGraph({ plugins: [FitPlugin] });

// Bad, never destroyed
const graph = new BaseGraph({ plugins: [FitPlugin] });
```

The invariant is that `new Graph(` and `new BaseGraph(` appear nowhere under `__tests__` outside `utils.ts`, which a
single grep checks. The one exception is `utils.test.ts`, which has to build a graph by hand to test
`registerGraphForTeardown()` itself.

### Never run the tests of a file concurrently

The teardown is an `afterEach` draining a registry that is module state, shared by every test of the file. It is
correct only because Jest runs the tests of a file one after the other. `test.concurrent` and `describe.concurrent`
opt out of that, so a graph would be destroyed while another test is still using it. The same goes for the registries
of maxGraph itself (shapes, edge styles, codecs), which are module state that tests register into and reset.

Running test **files** in parallel is fine and is not what this protects: each Jest worker gets its own module
registry and its own jsdom, so neither registry is shared across files. The `--runInBand` in the `test` script of
`packages/core/package.json` was added for an unrelated reason, the cost of running `tsc` in every worker back when
the suite used `ts-jest`, and dropping it would not break the teardown. Verified by running the suite with
`--maxWorkers=4`: 100 suites and 702 tests pass.

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
