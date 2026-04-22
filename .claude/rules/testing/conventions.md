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

## Troubleshooting

- Build core package first: `npm run build -w packages/core`
- Module resolution issues: check `moduleNameMapper` in `packages/core/jest.config.cjs`
