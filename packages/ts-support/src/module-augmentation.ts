// Checks that the types exposed by maxGraph can be extended with module augmentation.
//
// This works only because they are declared with `interface` and not with `type`: augmenting a type alias fails with
// "TS2300: Duplicate identifier". It also requires TypeScript 3.9 or higher. Older versions override the declaration
// instead of merging with it when the augmented type reaches the entry point through an `export *` re-export, which
// silently leaves the augmented type with the added property only.
import { CellStyle, Stylesheet } from '@maxgraph/core';

declare module '@maxgraph/core' {
  // Augment CellStateStyle rather than CellStyle: CellStyle extends CellStateStyle, so the added property is available
  // on both, and on everything else built on CellStateStyle (CellState.style, the Stylesheet default and named styles).
  interface CellStateStyle {
    myCustomStyleProperty?: number;
  }
}

const stylesheet = new Stylesheet();

// The augmented property is accepted, both in the type annotation and when the style is passed to the API.
const customStyle: CellStyle = { shape: 'rectangle', myCustomStyleProperty: 42 };
stylesheet.putCellStyle('aCustomVertexStyle', customStyle);

// A property that the augmentation does not declare is still rejected. Without this check, the statements above would
// also compile if `CellStyle` accepted arbitrary properties, and the test would prove nothing.
// @ts-expect-error 'anUndeclaredStyleProperty' does not exist in type 'CellStyle'
const invalidStyle: CellStyle = { shape: 'rectangle', anUndeclaredStyleProperty: 42 };
stylesheet.putCellStyle('anInvalidVertexStyle', invalidStyle);
