# Graph API Usage

Applies everywhere the maxGraph API is called: core sources, tests, Storybook stories and example packages.

## Inserting Cells

ALWAYS use the single object parameter form of `insertVertex` and `insertEdge`, never the positional one.

The positional form is a legacy signature inherited from `mxGraph`: a long list of arguments that are easily
transposed, require `null` placeholders for the values you do not set, and grow with every new feature. The object
form names each value and lets you omit what you do not need. Its JSDoc already marks the positional form as legacy,
and it is **going to be formally deprecated**, see
[issue #856](https://github.com/maxGraph/maxGraph/issues/856). It is not scheduled for removal, so that users
migrating from `mxGraph` are not broken.

Omit `parent` when the cell belongs to the default parent — both `VertexParameters.parent` and `EdgeParameters.parent`
already fall back to it. Do not call `graph.getDefaultParent()` just to pass the result straight back in.

```typescript
// Good
const vertex = graph.insertVertex({
  value: 'a vertex',
  position: [10, 20],
  size: [80, 40],
});
const edge = graph.insertEdge({ value: 'an edge', source, target });

// Bad — positional form, and parent passed explicitly for nothing
const parent = graph.getDefaultParent();
const vertex = graph.insertVertex(parent, null, 'a vertex', 10, 20, 80, 40);
const edge = graph.insertEdge(parent, null, 'an edge', source, target);
```

Roughly half the existing call sites still use the positional form. Converting the remaining ones is planned work
tracked in [issue #856](https://github.com/maxGraph/maxGraph/issues/856), the Storybook stories in particular. Apply
this rule to the code you write or modify; leave unrelated call sites to that dedicated effort rather than growing
the diff of the change at hand.
