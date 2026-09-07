---
sidebar_position: 10
description: How-to extend maxGraph, starting with custom properties on the Cell style.
---

# Extending maxGraph

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::

## Introduction

`maxGraph` is meant to be extended, and most of its extension points have a page of their own:

- [EdgeStyles](./edge-styles.md), to use the built-in ones and register your own connectors
- [Perimeters](./perimeters.md), same for the perimeter of a vertex
- Custom shapes have no page of their own yet: they go to the `ShapeRegistry`, listed with the other style registries in [Global Configuration](./global-configuration.md#styles)
- [Cell Handlers](./cell-handlers.md), to change how selected vertices and edges are manipulated
- [Plugins](./plugins.md), to add your own behavior to a graph instance
- [Codecs](./codecs.md), to control how your own objects are serialized to and from XML
- [Image Bundles](./image-bundles.md), to map the short keys used in cell styles to images
- [Global Configuration](./global-configuration.md), for the registries these extension points write to and their global state, and [Tree-Shaking](./tree-shaking.md) to register only what your application actually uses

This page gathers what those pages do not cover: the extension points that need something declared to `maxGraph` beyond a single registry call, so that the type level and the runtime agree. It currently covers the properties of the `Cell` style, and other subjects will be added here as they arise.

## Extending the `Cell` style

### When custom style properties are useful

The style of a `Cell` is the natural place for anything that drives how that cell is drawn. Every extension point that renders receives it, so declaring your own properties on it lets a single cell configure your own code, the same way a built-in property configures a built-in shape:

- a **custom shape** reads `this.style`, typed as `CellStateStyle`, so a property of yours turns a shape that hardcodes its appearance into one that is configured per cell, for instance a badge to draw in a corner, the number of sides of a polygon or the name of an icon;
- a **custom perimeter** receives the `CellState` of the vertex and a **custom edge style** the `CellState` of the edge, so both read their parameters from `state.style`;
- a **custom marker** receives the `Shape`, so it reads `shape.style` as well;
- **application data that must travel with the style** can live there too: the codecs encode and decode the whole style object, so a property of yours survives an XML round trip, and a named style in the `Stylesheet` sets it once for many cells.

Without such a declaration, the only ways to pass that value are to hardcode it in the shape, to reuse an unrelated built-in property for something it does not mean, or to reach the value through a cast, which gives up type checking exactly where a typo is most likely.

### Adding custom properties to the style types

`CellStateStyle` and `CellStyle` are declared as interfaces, so they support [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) (since 0.25.0). Declare your own properties once, anywhere in your application:

```typescript
declare module '@maxgraph/core' {
  interface CellStateStyle {
    myCustomStyleProperty?: number;
    myCustomBooleanStyleProperty?: boolean;
  }
}
```

`CellStyle` extends `CellStateStyle`, so a property declared on `CellStateStyle` is visible on both: it is accepted in the style set on a Cell as well as in the computed state style.

```typescript
import type { CellStyle } from '@maxgraph/core';

const style: CellStyle = { shape: 'rectangle', myCustomStyleProperty: 42 };
```

Augment `CellStyle` directly when the property only makes sense on the style declared on a Cell, and not on the computed state style.

Declare the properties as optional (`?`), as `maxGraph` does for its own, otherwise every style object of your application has to set them.

:::warning
Module augmentation of the types exposed by the package requires **TypeScript 3.9** or higher, which is the minimum version supported since 0.25.0. It silently does not work on TypeScript 3.8.
:::

### A shape configured by its own style property

A custom shape reading a property of its own from the style of the cell it draws, with the declaration that makes it type check:

```typescript
import type { AbstractCanvas2D } from '@maxgraph/core';
import { RectangleShape, ShapeRegistry } from '@maxgraph/core';

declare module '@maxgraph/core' {
  interface CellStateStyle {
    badgeColor?: string;
  }
}

class BadgedRectangleShape extends RectangleShape {
  override paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number): void {
    super.paintVertexShape(c, x, y, w, h);

    const badgeColor = this.style?.badgeColor;
    if (badgeColor) {
      c.setFillColor(badgeColor);
      c.ellipse(x + w - 8, y - 2, 10, 10);
      c.fillAndStroke();
    }
  }
}

ShapeRegistry.add('badgedRectangle', BadgedRectangleShape);
```

Each cell then chooses its own badge with `style: { shape: 'badgedRectangle', badgeColor: 'Crimson' }`, and the property is checked by the compiler like any built-in one.


### Only boolean properties must be declared to the codecs

:::info
This section applies **from version 0.25.0**. Until then, the codecs decoded every boolean style property as the number `1` or `0`, the properties of `maxGraph` itself included, and nothing could change that. Since 0.25.0 they decode the boolean properties they know about as real booleans, and the declaration described below is what puts your own properties in that set.
:::

When decoding, the codecs decide the type of a value from the **shape of the serialized value**, not from the type declared for the property.
A custom property of any type other than `boolean` therefore requires nothing at all: `myCustomStyleProperty="42"` decodes as the number `42`, and a property holding text decodes as a string (with one exception in a hand-written shape, see [Limits](#limits)).

Booleans are the single exception. They are serialized as `1` and `0`, which the shape alone cannot tell apart from a number, so the codecs have to be told which property names hold a boolean. That is the only reason why booleans, and only booleans, need to be declared.

The boolean properties that `maxGraph` declares are already known to the codecs since 0.25.0, so this concerns exclusively the properties you add by module augmentation.

It also only concerns applications that read XML with the codecs. If your application never decodes XML, the module augmentation of the previous section is all you need, and you can skip the rest of this page.

### Declaring custom boolean properties to the codecs

Call `registerCustomBooleanCellStylePropertiesForCodecs` (since 0.25.0) once at setup, next to the [codec registration](./codecs.md#codecs-registration):

```typescript
import {
  registerCoreCodecs,
  registerCustomBooleanCellStylePropertiesForCodecs,
} from '@maxgraph/core';

registerCoreCodecs();
registerCustomBooleanCellStylePropertiesForCodecs('myCustomBooleanStyleProperty');
```

The function accepts several names, so all custom boolean properties can be declared in a single call.

That single call covers the four shapes a style is serialized in:

- the `mxGraph` style string: `<mxCell style="myCustomBooleanStyleProperty=1"/>`
- the attribute form written by the `maxGraph` encoder: `<Object myCustomBooleanStyleProperty="1" as="style"/>`
- the child element form: `<Object as="style"><add as="myCustomBooleanStyleProperty" value="1"/></Object>`
- the stylesheet entry form: `<add as="myCustomBooleanStyleProperty" value="1"/>` inside a `<Stylesheet>`

The declaration only concerns **decoding**. Encoding requires nothing: the encoder decides from the type of the value rather than from the name of the property, so a custom boolean is already written as `1` or `0`.

The parameter is typed against `BooleanCellStyleKeys`, the boolean properties of `CellStyle`, so a property added by module augmentation is accepted, while a misspelled name, or a property declared with another type, does not compile.

:::note
The registration is global, like every other `register` function of `maxGraph`, so it holds a [global state](./global-configuration.md).

It adds to the properties declared by the library and never replaces them: a built-in boolean property keeps decoding as a boolean, whatever you register.

`unregisterAllCustomBooleanCellStylePropertiesForCodecs()` clears the properties registered by the application, leaving the built-in ones untouched. It is mainly useful to keep tests independent.
:::

### Scoping the decoding to a custom Codec

An application that prefers this behavior scoped to its own codec, instead of declared globally, can override the `isBooleanValueAttribute` hook of `ObjectCodec` (since 0.25.0):

```typescript
import { Codec, ObjectCodec } from '@maxgraph/core';

class MyCodec extends ObjectCodec {
  override isBooleanValueAttribute(dec: Codec, attr: any, obj: any): boolean {
    return (
      attr.nodeName === 'myCustomBooleanStyleProperty' ||
      super.isBooleanValueAttribute(dec, attr, obj)
    );
  }
}
```

When the decision is a plain list of names, set the `booleanFields` property instead of overriding the predicate, as this is what it is made for:

```typescript
class MyCodec extends ObjectCodec {
  override booleanFields = ['myCustomBooleanStyleProperty'];
}
```

See [Using custom object and custom Codec](./codecs.md#using-custom-object-and-custom-codec) for how to register such a codec.

Mind the scope of this alternative: it only affects the codec that declares it. Within that codec, it covers both the attribute form and the child element form of a value, but it does not reach the `mxGraph` style string form, which is parsed by an internal function rather than by a codec, nor the stylesheet form, which `StylesheetCodec` decodes on its own and where only the declared properties are consulted.

### Limits

Inside an `<Object as="style">` element, a style value can also be written as a child element instead of as an attribute. Since 0.25.0, that form decodes booleans like the attribute form does, so `<add as="rounded" value="1"/>` yields `true`.

In that same child element form, values of every other type remain strings: `<add as="strokeWidth" value="2"/>` yields the string `"2"`, while the attribute form `strokeWidth="2"` yields the number `2`. This is a known limitation of this hand-written shape, left as a follow-up. The `maxGraph` encoder never emits that shape for a style, it always writes attributes, so only hand-written XML is affected.
