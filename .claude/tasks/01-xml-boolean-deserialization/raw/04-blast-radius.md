# Raw exploration 4: consumer blast radius

## Category 1 (strict comparisons) is EMPTY, verified independently

`grep -rn -- "=== true|=== false|!== true|!== false" packages/core/src packages/core/__tests__` returns ZERO hits.
Same for packages/html/stories and the example packages. Every boolean style read is truthiness based, `??` defaulted
or `!!` coerced, all invariant under 1 -> true and 0 -> false. The "numeric 1 fails === true" hazard does not exist
in this repo today.

## Category 2, `||` defaults: exactly ONE in packages/core/src

`ConnectionsMixin.ts:175` `perimeter = edge.style[...] || false`. On THIS branch (off origin/main) it is still the old
`|| false`; PR #1160 changes it to `?? true` but is not merged.
Consequence worth keeping: today `entryPerimeter: 1` yields the number 1 while a programmatic `true` yields `true`,
and that leaks into `ConnectionConstraint.perimeter`, then into `ConnectionHandler.ts:1513` `c1.perimeter !== c2.perimeter`,
where `1 !== true` reports a spurious difference between an XML-loaded constraint and a code-built one. Making the
decoder emit real booleans makes that comparison stop lying. Strongest single argument for the fix.

Everything else already uses `??`: CellsMixin.ts:1803,1853,1865,1878,1894,1910,1923; EditingMixin.ts:137;
FoldingMixin.ts:74; LabelMixin.ts:50; GraphView.ts:1314,1334; Shape.ts:678,727,987-990; SwimlaneShape.ts:151,166;
ConnectorShape.ts:124; StencilShape.ts:253,271; mathUtils.ts:238,382,383,632; StackLayout.ts:300; SwimlaneManager.ts:201.

## Category 3, Cell.vertex / Cell.edge

`Cell.ts:278` `return this.vertex` and `:295` `return this.edge`, both declared `: boolean`, today returning 1/0 after
decode. The raw fields are read nowhere else in src (only Cell.ts:278,288,295,305); the ~60 call sites all go through
isVertex()/isEdge() in truthiness position. Nothing breaks, the types stop lying.

## Category 4, numbers written into boolean-typed keys

Real bugs in src, independent of our change:
- `GraphLayout.ts:244` `this.graph.setCellStyles('noEdgeStyle', value ? '0' : '1', [edge])` writes the STRING '0',
  which is truthy, so `setEdgeStyleEnabled(edge, true)` is a no-op: `GraphView.ts:1334` reads
  `!(edge.style.noEdgeStyle ?? false)`, and `EdgeHandler.ts:419` the same.
  ALREADY ADDRESSED by the DRAFT PR maxGraph#1028 `fix: enforce type-safe value in setCellStyles`, branch
  `refactor/improve_signature_types_setCellStyles`, base main. It rewrites the call as
  `setCellStyles('noEdgeStyle', !value, [edge])` and `setOrthogonalEdge` as `setCellStyles('orthogonal', !!value, ...)`,
  and above all it makes the writer type-safe: `setCellStyles<K extends keyof CellStateStyle>(key: K, value:
  CellStateStyle[K] | undefined | null)` in `styleUtils.ts` and `CellsMixin.type.ts`, so passing a string to a boolean
  key becomes a COMPILE ERROR. It also switches the removal path to `isNullish(value) ? undefined : value`.
  So this whole category is the WRITE side and it is being fixed there; ours is the DECODE side. The two are
  complementary and both are needed: #1028 stops the library from writing '0', we stop the codec from reading 1.
  Note the #1028 diff is stale on ConnectionsMixin: its hunk turns `setCellStyles('exitPerimeter', '0')` into `false`,
  but main already writes real booleans there (ConnectionsMixin.ts:202-208), so only the GraphLayout sites and the
  signatures remain unique to it. Its files: styleUtils.ts, CellsMixin.type.ts, GraphLayout.ts, ConnectionsMixin.ts,
  types.ts (entryX/entryY JSDoc), __tests__/view/mixin/EdgeMixin.test.ts.
- `StylesheetCodec.ts:176` `if (value) { style[key] = value; }` silently DROPS `<add as="rounded" value="0"/>`.
  Emitting `false` instead of `0` does NOT fix it, `false` is falsy too. Needs `if (value != null)`.

Stories, type-inconsistent but working:
- `OrgChart.stories.js:118-120` `style.shadow = '1'` etc (truthy strings), `:133,:136` `exitPerimeter = 0` /
  `entryPerimeter = 0` (falsy numbers).
- `HoverStyle.stories.js:46` `state.style.rounded = hover ? '1' : '0'`: '0' is truthy, so `Shape.ts:989`
  keeps the shape rounded on hover-out. That un-hover branch has never worked. Latent bug regardless.

Both files are `.js`, so they are neither type-checked nor linted (the repo lints TypeScript only). These sites will be
caught and fixed when the stories are ported to TypeScript, tracked by issue maxGraph#1035 "Migrate all JavaScript
stories to TypeScript": the compiler will reject `'1'` and `0` on a `boolean` style property. Out of scope here, and
they are not a reason to touch the stories in this task.

## Category 5, code relying on the value being a number: NONE

No arithmetic, no Number(), no parseInt/parseFloat, no `? 1 : 0` on any boolean style key.
Adjacent look-alikes that are safe: `SvgCanvas2D.ts:786` `(s.fixDash ? 1 : s.strokeWidth)`;
`XmlCanvas2D.ts:367,740-741` `flipH ? '1' : '0'` (export from local booleans);
`styleUtils.ts:417-435` setStyleFlag (bitwise, typed NumericCellStateStyleKeys, never a boolean key);
`ImageShape.ts:76` `this.preserveImageAspect = this.style.imageAspect` (only `!` and a canvas flag);
`Shape.ts:987-990` same pattern for isShadow/isDashed/isRounded/glass.

## Sites that get BETTER

- `XmlCanvas2D.ts:357` `if (this.state.dashed === value)` and `:601` `if (this.state.shadow === value)`, the
  compressed-output dedup. A mixed graph (some cells from XML with 1, some from code with true) defeats it today and
  emits redundant elements. Normalizing fixes the dedup.
- `AbstractGraph.ts:973-977` `isOrthogonal()` returns `edge.style.orthogonal` declared `: boolean`, today 0/1 from XML.
  Callers are truthiness only (GraphView.ts:1421 then the perimeter functions).
- `Stylesheet.ts:187` `cellStyle[key] == NONE ? delete ... : ...`: both `0 == 'none'` and `false == 'none'` are false.

## Pre-existing bug in the same family, in the diff neighborhood

`CellsMixin.ts:1175-1185`: `if (style.resizeWidth) { geo.width = w * dx } else if (!style.resizeWidth) { geo.width = w }`.
The two branches are exhaustive, so an UNSET property is treated like `false` and the width is pinned. The `else if`
was presumably meant to be `!= null` guarded.

## THE design caveat: both decoders are KEY-AGNOSTIC

They convert by inspecting the VALUE (`isNumeric`), not by consulting a list of boolean keys. Turning every "1"/"0"
into a boolean would also convert genuinely numeric styles that happen to be 0 or 1: `strokeWidth=1`, `opacity=0`,
`fontStyle=1`, `arcSize=0`, `entryX=0`, `entryY=1`, `imageWidth`, `perimeterSpacing`.
`entryX=0` becoming `false` would be a serious regression: `ConnectionsMixin.ts:160-166` checks `x !== undefined` then
does `new Point(x, y)`.
So the fix needs an explicit allow-list of boolean keys, applied in `ObjectCodec.convertAttributeFromXml` /
`isNumericAttribute`, in `convertToNumericIfNeeded` (codec/mxGraph/utils.ts) and in StylesheetCodec.
`Cell.vertex` / `Cell.edge` need the same treatment in `CellCodec.isNumericAttribute` (CellCodec.ts:75-77), which
currently only special-cases `value`.
