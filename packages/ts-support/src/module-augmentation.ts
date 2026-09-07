// Checks that the types exposed by maxGraph can be extended with module augmentation.
//
// This works only because they are declared with `interface` and not with `type`: augmenting a type alias fails with
// "TS2300: Duplicate identifier". It also requires TypeScript 3.9 or higher. Older versions override the declaration
// instead of merging with it when the augmented type reaches the entry point through an `export *` re-export, which
// silently leaves the augmented type with the added property only.
import {
  CellStyle,
  registerCustomBooleanCellStylePropertiesForCodecs,
  Stylesheet,
} from '@maxgraph/core';

declare module '@maxgraph/core' {
  // Augment CellStateStyle rather than CellStyle: CellStyle extends CellStateStyle, so the added property is available
  // on both, and on everything else built on CellStateStyle (CellState.style, the Stylesheet default and named styles).
  interface CellStateStyle {
    myCustomStyleProperty?: number;
    myCustomBooleanStyleProperty?: boolean;
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

// An augmented boolean property is accepted by the codec registration, which is what makes the two halves of the
// feature line up: the augmentation declares the property to the compiler, and this call declares it to the codecs so
// that a serialized `1` is decoded as `true` rather than as the number 1.
registerCustomBooleanCellStylePropertiesForCodecs('myCustomBooleanStyleProperty');

// A misspelled property is rejected, which is what makes the check above worth anything.
// @ts-expect-error 'myCustomBooleanStylePropertyTypo' is not assignable to 'BooleanCellStyleKeys'
registerCustomBooleanCellStylePropertiesForCodecs('myCustomBooleanStylePropertyTypo');

// So is a property that is declared but is not a boolean, since only a boolean needs declaring: every other type is
// already decoded correctly from the shape of the serialized value.
// @ts-expect-error 'myCustomStyleProperty' is a number, not a boolean
registerCustomBooleanCellStylePropertiesForCodecs('myCustomStyleProperty');
