/*
Copyright 2025-present The maxGraph project Contributors

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

import {
  type CellStateStyle,
  registerCoreCodecs,
  Stylesheet,
  unregisterAllCodecs,
} from '../../../src';
import { describe, expect, test } from '@jest/globals';
import { exportObject, importToObject } from './shared';
import {
  absentProperty,
  allBooleanCellStyleCases,
  type BooleanCellStyleCase,
  booleanCellStyleCasesFor,
  buildExpectedStyle,
  coerceNumericLookingValue,
  type SerializedBooleanValue,
  serializedBooleanValues,
} from '../boolean-style-properties';

// Prevents side effects between tests
beforeAll(() => {
  unregisterAllCodecs();
});
beforeEach(() => {
  registerCoreCodecs();
});
afterEach(() => {
  unregisterAllCodecs();
});

test('import', () => {
  const stylesheet = new Stylesheet();
  importToObject(
    stylesheet,
    `<Stylesheet>
  <add as="custom">
    <add value="red" as="fillColor" />
    <add value="true" as="rounded" />
    <add value="blue" as="strokeColor" />
  </add>
</Stylesheet>`
  );

  const style = stylesheet.styles.get('custom');
  expect(style).toEqual({
    fillColor: 'red',
    rounded: 'true',
    strokeColor: 'blue',
  });
});

test('export', () => {
  const stylesheet = new Stylesheet();
  stylesheet.putCellStyle('custom', {
    fillColor: 'red',
    rounded: true,
    strokeColor: 'blue',
  });

  const xml = exportObject(stylesheet);
  expect(xml).toEqual(
    `<Stylesheet>
  <add as="defaultVertex">
    <add value="rectangle" as="shape" />
    <add value="rectanglePerimeter" as="perimeter" />
    <add value="middle" as="verticalAlign" />
    <add value="center" as="align" />
    <add value="#C3D9FF" as="fillColor" />
    <add value="#6482B9" as="strokeColor" />
    <add value="#774400" as="fontColor" />
  </add>
  <add as="defaultEdge">
    <add value="connector" as="shape" />
    <add value="classic" as="endArrow" />
    <add value="middle" as="verticalAlign" />
    <add value="center" as="align" />
    <add value="#6482B9" as="strokeColor" />
    <add value="#446299" as="fontColor" />
  </add>
  <add as="custom">
    <add value="red" as="fillColor" />
    <add value="true" as="rounded" />
    <add value="blue" as="strokeColor" />
  </add>
</Stylesheet>
`
  );
});

/**
 * Expected value when decoding a stylesheet entry, `<add as="rounded" value="1"/>`.
 *
 * Characterizes the CURRENT WRONG behavior of `StylesheetCodec.decode`, which coerces a numeric looking value to a
 * number and then stores it only when it is truthy: a boolean property never decodes to a boolean, and one of the
 * four spellings does not decode at all. The fix flips this function, and the whole matrix below with it.
 */
const decodedFromStylesheetEntry = (serializedValue: SerializedBooleanValue): unknown =>
  serializedValue === '0' ? absentProperty : coerceNumericLookingValue(serializedValue);

const styleName = 'booleanProperties';

const decodeStyleEntries = (
  cases: readonly BooleanCellStyleCase[]
): CellStateStyle | undefined => {
  const entries = cases
    .map(
      ({ key, serializedValue }) => `    <add value="${serializedValue}" as="${key}" />`
    )
    .join('\n');
  const stylesheet = new Stylesheet();
  importToObject(
    stylesheet,
    `<Stylesheet>
  <add as="${styleName}">
${entries}
  </add>
</Stylesheet>`
  );
  return stylesheet.styles.get(styleName);
};

const aggregateCases: [string, SerializedBooleanValue][] = serializedBooleanValues.map(
  (serializedValue) => [
    `all boolean properties as value="${serializedValue}"`,
    serializedValue,
  ]
);

const singlePropertyCases: [string, BooleanCellStyleCase][] =
  allBooleanCellStyleCases.map((booleanCase) => [
    `${booleanCase.key} as value="${booleanCase.serializedValue}"`,
    booleanCase,
  ]);

describe('import boolean properties, characterization of the current wrong behavior', () => {
  test.each(aggregateCases)('%s', (_title, serializedValue) => {
    const cases = booleanCellStyleCasesFor(serializedValue);
    expect(decodeStyleEntries(cases)).toEqual(
      buildExpectedStyle(cases, decodedFromStylesheetEntry)
    );
  });

  test.each(singlePropertyCases)('%s', (_title, booleanCase) => {
    expect(decodeStyleEntries([booleanCase])).toEqual(
      buildExpectedStyle([booleanCase], decodedFromStylesheetEntry)
    );
  });

  // Defect, and the one this path does not share with the other two: the numeric coercion turns value="0" into the
  // number 0, which the truthiness guard of StylesheetCodec.decode then discards, so the property is not stored at
  // all rather than being stored as false. Emitting false instead of 0 does not fix it, false is falsy too.
  test('value="0" makes the property vanish instead of storing false', () => {
    expect(decodeStyleEntries([{ key: 'rounded', serializedValue: '0' }])).toEqual({});
  });

  // Defect in the opposite direction: 'false' is not numeric, so it is stored as the string 'false', which is truthy
  // at every use site. Stylesheets exported by released versions of maxGraph contain that spelling.
  test('value="false" is stored as the truthy string false', () => {
    expect(decodeStyleEntries([{ key: 'rounded', serializedValue: 'false' }])).toEqual({
      rounded: 'false',
    });
  });
});
