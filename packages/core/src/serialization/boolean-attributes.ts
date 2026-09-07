/*
Copyright 2026-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import type { BooleanCellStyleKeys, CellStyle } from '../types.js';

/**
 * The boolean properties of {@link CellStyle}, the only way to know that a serialized `1` means `true` when the value
 * is stored in a plain object.
 *
 * A style object is decoded by the generic `Object` codec, whose template is an empty object, so nothing about the
 * target says which of its properties are boolean. Class instances need no such list, see
 * {@link isBooleanFieldOfTarget}.
 *
 * Two checks tie this list to the interface, so that a boolean property added to {@link CellStyle} or
 * {@link CellStateStyle} cannot be forgotten here: the `satisfies` clause rejects a name that is not a boolean
 * property, and the assertion below rejects a boolean property that is missing from the list. The `as const` is what
 * makes the second check work, since without it the element type widens and the assertion holds for any list.
 */
export const booleanCellStyleProperties = [
  'ignoreDefaultStyle',
  'absoluteArcSize',
  'anchorPointDirection',
  'autoSize',
  'backgroundOutline',
  'bendable',
  'cloneable',
  'curved',
  'dashed',
  'deletable',
  'editable',
  'endFill',
  'entryPerimeter',
  'exitPerimeter',
  'fixDash',
  'flipH',
  'flipV',
  'foldable',
  'glass',
  'horizontal',
  'imageAspect',
  'movable',
  'noEdgeStyle',
  'noLabel',
  'orthogonal',
  'orthogonalLoop',
  'pointerEvents',
  'portConstraintRotation',
  'resizable',
  'resizeHeight',
  'resizeWidth',
  'rotatable',
  'rounded',
  'shadow',
  'startFill',
  'swimlaneLine',
] as const satisfies readonly BooleanCellStyleKeys[];

/**
 * The boolean properties of {@link CellStyle} that {@link booleanCellStyleProperties} does not list, `never` when the
 * list is complete.
 *
 * Only meaningful because the list is declared `as const`: with a widened element type this would always be `never`.
 */
type UnlistedBooleanCellStyleKey = Exclude<
  BooleanCellStyleKeys,
  (typeof booleanCellStyleProperties)[number]
>;

/**
 * Fails to compile when {@link booleanCellStyleProperties} is missing a boolean property of {@link CellStyle}, naming
 * the problem in the error message rather than reporting a type mismatch.
 *
 * The declaration is the check: assigning `true` is only valid while {@link UnlistedBooleanCellStyleKey} is `never`.
 * It runs wherever this source is compiled, so `npm run build` fails, and that is a step the CI already performs on
 * every push. A boolean property added to the interface therefore cannot be released without being listed here, which
 * is the whole point: an unlisted property would silently keep decoding as a number.
 *
 * The `void` below is what keeps the constant from being reported as unused. The check lives in the type, so the value
 * itself is never read.
 */
const noBooleanPropertyIsUnlisted: [UnlistedBooleanCellStyleKey] extends [never]
  ? true
  : 'booleanCellStyleProperties is missing at least one boolean property of CellStyle' =
  true;

void noBooleanPropertyIsUnlisted;

const booleanCellStylePropertyNames: ReadonlySet<string> = new Set(
  booleanCellStyleProperties
);

const customBooleanCellStylePropertyNames = new Set<string>();

/**
 * Declares custom boolean properties of {@link CellStyle} to the codecs, so that they are decoded as booleans
 * instead of as the number `1` or `0`.
 *
 * Only needed for a property added by module augmentation of {@link CellStateStyle}, and only for a `boolean` one: a
 * property of any other type needs nothing, because the codecs decide from the shape of the serialized value, and
 * only a boolean is indistinguishable from a number once written as `1`.
 *
 * One call covers the three shapes a style can be serialized in: the mxGraph string form `style="myFlag=1"`, the
 * attribute form `<Object myFlag="1" as="style"/>` and the stylesheet form `<add as="myFlag" value="1"/>`.
 *
 * Decoding only. Encoding needs no declaration, since it decides from the type of the value rather than from the name
 * of the property, so a custom boolean is already written as `1` or `0`.
 *
 * Adds to the properties the library declares, it never replaces them, so omitting a built-in property here does not
 * disable it. The registration is global, like every other `register` function of maxGraph, and
 * {@link unregisterAllCustomBooleanCellStylePropertiesForCodecs} clears what was registered here without touching the
 * built-in properties.
 *
 * ```typescript
 * declare module '@maxgraph/core' {
 *   interface CellStateStyle {
 *     myCustomFlag?: boolean;
 *   }
 * }
 *
 * registerCustomBooleanCellStylePropertiesForCodecs('myCustomFlag');
 * ```
 *
 * @param properties the names of the properties to declare. Typed against {@link BooleanCellStyleKeys}, so a property
 * declared by module augmentation is accepted while a misspelled one does not compile.
 * @category Serialization with Codecs
 * @since 0.25.0
 */
export const registerCustomBooleanCellStylePropertiesForCodecs = (
  ...properties: BooleanCellStyleKeys[]
): void => {
  properties.forEach((property) => customBooleanCellStylePropertyNames.add(property));
};

/**
 * Clears the properties declared with {@link registerCustomBooleanCellStylePropertiesForCodecs}, leaving the
 * properties the library declares untouched.
 *
 * Mainly useful to keep tests independent, as the registration is global.
 *
 * @category Serialization with Codecs
 * @since 0.25.0
 */
export const unregisterAllCustomBooleanCellStylePropertiesForCodecs = (): void => {
  customBooleanCellStylePropertyNames.clear();
};

/**
 * Returns `true` when the given name is a boolean property of {@link CellStyle}, declared by the library or by the
 * application through {@link registerCustomBooleanCellStylePropertiesForCodecs}.
 *
 * @internal
 */
export const isBooleanCellStyleProperty = (name: string): boolean =>
  booleanCellStylePropertyNames.has(name) ||
  customBooleanCellStylePropertyNames.has(name);

/**
 * Returns `true` when the given target already holds a boolean in the given field.
 *
 * Used to decide that a serialized value must be decoded as a boolean, for everything that is not a style: the field
 * of a class instance is initialized by its declaration, so the object being decoded into is its own source of truth
 * and no list has to be maintained. It works for a plain object too, as long as that object is reached through the
 * field of something else and therefore carries its own defaults, which is the case of the graph folding options.
 *
 * @internal
 */
export const isBooleanFieldOfTarget = (target: unknown, name: string): boolean =>
  typeof (target as Record<string, unknown>)?.[name] === 'boolean';
