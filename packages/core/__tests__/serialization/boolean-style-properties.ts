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
 * The value a serialized boolean decodes to, whichever of the three decode paths it travelled.
 *
 * Shared by all of them on purpose. Before the fix each path had to declare its own expectation, because they
 * disagreed: two produced a number and the third dropped a property written as `0` altogether. Having a single
 * function here is what the fix bought, and a path drifting from the others would now show up as a failure.
 */
export const decodedBooleanValue = (serializedValue: SerializedBooleanValue): boolean =>
  serializedValue === '1' || serializedValue === 'true';

/**
 * The decoded style expected for the given cases, as an untyped record.
 *
 * Untyped rather than a `CellStyle` so that a caller may assert an unexpected type without a type suppression, which
 * is what let the characterization tests assert the numbers this fix replaced.
 */
export const buildExpectedStyle = (
  cases: readonly BooleanCellStyleCase[],
  decodedValue: (serializedValue: SerializedBooleanValue) => unknown = decodedBooleanValue
): Record<string, unknown> =>
  Object.fromEntries(
    cases.map(({ key, serializedValue }) => [key, decodedValue(serializedValue)])
  );
