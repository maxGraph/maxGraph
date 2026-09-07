# ADR 0004: Register custom boolean style properties for the codecs

- **Status**: Accepted
- **Date**: 2026-09-07
- **Scope**: `packages/core/src/serialization/boolean-attributes.ts`,
  `packages/core/src/serialization/ObjectCodec.ts`, `packages/core/src/serialization/codec/mxGraph/utils.ts`,
  `packages/core/src/serialization/codec/StylesheetCodec.ts`, `packages/core/src/types.ts`
- **Analysis basis**: commit `2135b2701`, during the development of version 0.25.0. Any file or line reference below
  points to that commit
- **Related**: [ADR 0002](0002-use-plugins-for-optional-and-new-features.md),
  user documentation: [`codecs.md`](../../packages/website/docs/usage/codecs.md),
  [`global-configuration.md`](../../packages/website/docs/usage/global-configuration.md)

## Context

The XML decoders never produced a boolean. All three decode paths applied the same rule, "a numeric looking string
becomes a number", deciding on the shape of the **value** and never on the type of the **target**. So `rounded="1"`
landed in `CellStateStyle.rounded` as the number `1`, and `vertex="1"` landed in `Cell.vertex` as the number `1`.
Fixing that requires answering one question at every decode site: is this property a boolean?

For everything the codecs decode into a **class instance**, the object itself answers. A field is initialized by its
declaration, `Cell.vertex = false` for instance, so `typeof target[name] === 'boolean'` is enough and no list has to be
maintained. That is `isBooleanFieldOfTarget` in `boolean-attributes.ts`.

A **style** cannot be answered that way. It is decoded into a plain object by the generic `Object` codec, whose
template is `{}` and whose `cloneTemplate()` also returns `{}`, so the target is empty at the moment the decision has
to be taken and nothing about it says which of its properties are boolean. The only source of truth is the `CellStyle`
interface, and an interface exists at compile time only. A runtime list of its boolean properties is therefore
unavoidable, whatever else is decided: there are 36 of them today.

Two further facts shape the decision:

**Only booleans need declaring.** The decoders coerce by the shape of the value, so a custom `number` property already
decodes as a number and a custom `string` property as a string. `1` is the single ambiguous case, which is why booleans
and only booleans need a name-keyed mechanism. The encode side needs nothing either: `ObjectCodec.isBooleanAttribute`
tests the value with `value == true || value == false`, a question about the value and not about its name, so a custom
boolean property already exports as `1` or `0`.

**The library can no longer know every style property.** Object types exposed by the package became `interface`
declarations during this same development cycle (commit `632341982`), which unlocked
[module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) of
`CellStateStyle`. That affordance is presented in the changelog as purely type level, with no runtime contract and no
mention of serialization. It is demonstrated by `packages/ts-support/src/module-augmentation.ts`, a `tsc` only compile
check, on a `number` property, and there is no runtime test of an augmented property anywhere in the tree. An
application can now declare a boolean style property the library has no way of knowing about, and that property would
silently decode as `1`.

## Decision

### D1. The properties the library declares are a plain module-level constant, never registered

`booleanCellStyleProperties` in `packages/core/src/serialization/boolean-attributes.ts` is a `const` imported directly
by the codec modules that need it. It is not populated by a registration call, and no registration call can remove
from it.

This is the load-bearing half of the decision, and it is what rules out R1 below. It also keeps the module tree
shakeable: an application that never decodes XML pulls in neither the list nor the predicates.

### D2. A minimal additive registration API carries the properties the application declares

Two functions, exported from the package index:

```typescript
registerCustomBooleanCellStylePropertiesForCodecs(...properties: BooleanCellStyleKeys[]): void;
unregisterAllCustomBooleanCellStylePropertiesForCodecs(): void;
```

They write to a second, initially empty set, and the predicate `isBooleanCellStyleProperty` consults both sets. Four
consequences of that shape are deliberate:

- **`Custom` in the name** says the call adds to the properties the library declares rather than declaring the complete
  set, so omitting a built-in property does not disable it.
- **`ForCodecs`** says the declaration is consumed by the codecs, so it changes decoding and not rendering, and not
  `getCellStyle` either. `Properties` rather than `Keys` matches the vocabulary of the rest of the codebase.
- **Typed against `BooleanCellStyleKeys`**, itself derived from `CellStyle`. Because a consumer's `declare module`
  block adds their property to that interface, their own property name is accepted in their own compilation unit while
  a misspelled one is a compile error. The type level and runtime halves of module augmentation then line up instead of
  being two disconnected mechanisms.
- **An `unregisterAll` companion**, clearing only the custom set. Every `reset` and `unregisterAll` function in this
  codebase exists because global mutable state leaks between tests, and this state is global like every other maxGraph
  `register` function.

The storage and reset shape come from the configuration objects (`view/style/config.ts` and siblings), the naming from
the registry family (`view/style/register.ts`). `BaseRegistry` was not reused: the `Registry<V>` interface mandates
`get(name)` and `getName(value)`, both meaningless for a set of names with no values.

### D3. Two compile-time checks tie the list to the interface

The list is declared `as const satisfies readonly BooleanCellStyleKeys[]`, which rejects a name that is not a boolean
property of `CellStyle`, and a module-private assertion rejects a boolean property of `CellStyle` that is missing from
the list, naming the problem in the error message. The `as const` is what makes the second check meaningful: with a
widened element type it would hold for any list.

The assertion is deliberately **not exported**. TypeScript emits declarations only for exported symbols, so keeping it
private ensures the unresolved conditional type never reaches the published `.d.ts`, where a consumer's own
augmentation combined with `skipLibCheck: false` could otherwise make the library's declarations fail to compile.

### D4. A per-codec declarative field complements the global list, it does not replace it

`ObjectCodec.booleanFields` names the boolean fields of a codec-backed class that the runtime check described in the
Context cannot see, because they are assigned from a constructor argument rather than initialized by their declaration,
and `isBooleanValueAttribute` stays overridable for an application that wants the behaviour scoped to its own codec.
Neither is a substitute for the global list, for the reason given in R3.

## Rejected options

### R1. Putting the properties the library declares behind the same registration call

Rejected on behaviour, not on cost. An application that forgot the call would silently lose correct boolean decoding,
which makes the correctness of XML decoding depend on a setup step. That reproduces the `Graph` versus `BaseGraph`
footgun already documented in
[`global-configuration.md`](../../packages/website/docs/usage/global-configuration.md) and
[`tree-shaking.md`](../../packages/website/docs/usage/tree-shaking.md), and it would do so for data correctness
rather than for a missing feature, which is worse: nothing fails, the values are just wrong.

This objection holds under every option, which is why the properties the library declares had to stay a plain constant
in any case, and why a registry can only ever be an additive second lookup.

### R2. A full metadata registry mapping every style property to a type

A registry of `name -> 'boolean' | 'number' | 'string'`, threaded into `ObjectCodec.isNumericAttribute` as well.
About 15 files and 5 or more public names, for a problem whose entire content is 36 known names plus the occasional
application one. It also invites the question of what happens when the registry and the interface disagree, which the
`satisfies` clause of D3 answers for free by refusing to compile.

### R3. A per-codec static option, in the spirit of `ObjectCodec.allowEval`

Cannot reach the mxGraph style string path at all. `convertStyleFromString` is a free function in
`serialization/codec/mxGraph/utils.ts`, not a codec class, so a static on a codec has no way to influence it. Covering
the three decode paths would need a second, differently shaped knob with no reset, and `allowEval` is a mutable static
predating the configuration object convention, so following it would revive the pattern those objects replaced.

What shipped as D4 is a per-codec **instance** field plus an overridable predicate, which is a complement for
codec-backed classes and not the mechanism for styles.

### R4. Doing nothing, and documenting the limitation

This was the original recommendation of the analysis, and it was dropped once the mxGraph style string path turned out
to have no usable hook. `convertStyleFromString` is not re-exported from the package (`codec/_model-codecs.ts` carries
only `mxCellCodec` and `mxGeometryCodec`), so the only workaround available to an application on that path is to
subclass `mxCellCodec`, override `decodeAttribute`, call `super` and coerce its own properties afterwards.

Documenting three different per-path workarounds, one of which replaces a shipped codec, reads badly for a feature the
changelog advertises as an extension point. Weighed against that, the API costs three marginal files over the fix
itself, so the balance moved.

The arguments that supported R4 are recorded, since they remain true and would be the ones to revisit if the API ever
needs reconsidering: the augmentation feature has no demonstrated user yet, and the codebase's own precedent for this
artifact, `geometryNumericAttributes` and `pointNumericAttributes` in `ObjectCodec.ts`, is a module-private constant
array that never needed an API.

## Consequences

**Positive**

- An application owes nothing at all unless it decodes XML. Augmenting `CellStateStyle` is what satisfies the
  compiler, and the registration call is needed only when a boolean property of its own travels through the codecs. A
  property of any other type never needs it, and the assertion of D3 stays out of the published declarations, so an
  application's augmentation cannot make the library's own types fail to compile.
- An application that extends `CellStateStyle` with a boolean property gets correct decoding on all four shapes a
  style can be serialized in, the mxGraph string form `style="myFlag=1"`, the attribute form
  `<Object myFlag="1" as="style"/>`, the child element form `<Object as="style"><add as="myFlag" value="1"/></Object>`
  and the stylesheet entry form `<add as="myFlag" value="1"/>`, from a single call.
- The type level and runtime halves of module augmentation stop being disconnected: the parameter type of the
  registration function is derived from the interface the application augments.
- Nothing breaks for an application that never calls it, and nothing is added to the bundle of an application that
  never decodes XML.
- The functions are additive, so they get no changelog entry under the project policy of listing breaking changes only.

**Negative, and the maintenance obligation this creates**

The obligation below falls on maxGraph itself and never on an application that extends the style types. An application
does not edit `booleanCellStyleProperties` and cannot reach it: the package entry point re-exports only the two
registration functions from that module, and the `exports` map of the package declares a single code entry, so a deep
import is refused as well.

- **A boolean property added to `CellStateStyle` or `CellStyle` by the library must be added to
  `booleanCellStyleProperties`.** This is not a convention to remember: the module-private assertion of D3 makes the
  compilation fail until the property is listed, and `npm run build` for the core package is a CI step on every push,
  so the property cannot be released unlisted. The failure names the missing property rather than reporting a type
  mismatch.
- Two lists now describe the same domain, the interface and the runtime constant, which is duplication the language
  cannot remove. D3 reduces it to a mechanical, compiler-enforced duplication rather than a semantic one.
- The registration state is global and mutable, so a test that registers has to clear it. That is what the
  `unregisterAll` companion is for.
- The library now makes its first user-facing claim that custom style properties have a runtime dimension, so the
  documentation has to state precisely what registration does and does not cover.

**Neutral but worth recording**

- The naming is knowingly inconsistent with the type it is built on: the augmented interface is `CellStateStyle` and
  the derived type is `BooleanCellStyleKeys`, so the function says `CellStyle` while its parameter type is derived from
  `CellStyle` which extends `CellStateStyle`. `CellStyle` is the term users know and set on a cell, so the shorter word
  won.
- `Global` is deliberately absent from the name. Every `register` function in maxGraph is global and the project
  documents that as a property of its registries, so naming it in one function would imply the others are not. The
  scope is stated in the JSDoc instead.
- This is the first ADR about the extensibility of the public **types** rather than about class structure. Nothing in
  ADRs 0001 to 0003 applies to it, and it applies to none of them.
