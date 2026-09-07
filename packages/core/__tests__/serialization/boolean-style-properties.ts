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

import { booleanCellStyleProperties } from '../../src/serialization/boolean-attributes';

/**
 * The spellings a boolean can take in XML. maxGraph and mxGraph both write `1` and `0`, while `true` and `false`
 * occur in stylesheets exported by released versions of maxGraph and in hand written files.
 */
export const serializedBooleanValues = ['1', '0', 'true', 'false'] as const;

export type SerializedBooleanValue = (typeof serializedBooleanValues)[number];

export interface BooleanCellStyleCase {
  /**
   * Deliberately widened to `string` rather than `BooleanCellStyleKeys`: it is used to index expected values that hold
   * the wrong type on purpose, and a narrower type would force a type suppression at every use site.
   */
  readonly key: string;
  readonly serializedValue: SerializedBooleanValue;
}

export const booleanCellStyleCasesFor = (
  serializedValue: SerializedBooleanValue
): readonly BooleanCellStyleCase[] =>
  booleanCellStyleProperties.map((key) => ({ key, serializedValue }));

export const allBooleanCellStyleCases: readonly BooleanCellStyleCase[] =
  serializedBooleanValues.flatMap((serializedValue) =>
    booleanCellStyleCasesFor(serializedValue)
  );

/**
 * Marks a property that the decoder does not store at all, as opposed to storing a wrong value.
 */
export const absentProperty = Symbol('absent property');

/**
 * The value a numeric looking string is coerced to today, which is what makes a boolean property decode wrongly.
 *
 * Shared because the mxGraph style string parser and the XML attribute decoder genuinely apply the same rule, each
 * through its own implementation of "if the value looks numeric, parse it as a number, otherwise keep the string".
 * Each decode path declares its own expected value, in its own test file, in terms of this rule.
 */
export const coerceNumericLookingValue = (
  serializedValue: SerializedBooleanValue
): unknown =>
  serializedValue === '1' ? 1 : serializedValue === '0' ? 0 : serializedValue;

/**
 * The decoded style expected for the given cases, as an untyped record.
 *
 * Untyped on purpose: `toEqual` accepts `unknown`, so an expectation that is not declared as a `CellStyle` needs no
 * type suppression even while it holds numbers where the interface declares booleans.
 *
 * Cases whose expected value is {@link absentProperty} are left out of the record entirely.
 */
export const buildExpectedStyle = (
  cases: readonly BooleanCellStyleCase[],
  decodedValue: (serializedValue: SerializedBooleanValue) => unknown
): Record<string, unknown> => {
  const expected: Record<string, unknown> = {};
  for (const { key, serializedValue } of cases) {
    const value = decodedValue(serializedValue);
    if (value !== absentProperty) {
      expected[key] = value;
    }
  }
  return expected;
};
