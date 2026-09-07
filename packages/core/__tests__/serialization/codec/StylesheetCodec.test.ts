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
  allBooleanCellStyleCases,
  type BooleanCellStyleCase,
  booleanCellStyleCasesFor,
  buildExpectedStyle,
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
    rounded: true,
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
    expect(decodeStyleEntries(cases)).toEqual(buildExpectedStyle(cases));
  });

  test.each(singlePropertyCases)('%s', (_title, booleanCase) => {
    expect(decodeStyleEntries([booleanCase])).toEqual(buildExpectedStyle([booleanCase]));
  });

  // Regression guard, for the defect this path did not share with the other two: the decoded value used to be stored
  // only when it was truthy, so value="0" was coerced to the number 0 and then discarded, leaving the property out of
  // the style entirely. Storing false rather than 0 was not enough to fix it, false being falsy too.
  test('value="0" is stored as false rather than dropped', () => {
    expect(decodeStyleEntries([{ key: 'rounded', serializedValue: '0' }])).toEqual({
      rounded: false,
    });
  });

  // Regression guard for the opposite direction, and for the stylesheets exported by released versions of maxGraph,
  // which carry that spelling: 'false' is not numeric, so it used to be stored as the string 'false', truthy at every
  // use site.
  test('value="false" is stored as false rather than as a truthy string', () => {
    expect(decodeStyleEntries([{ key: 'rounded', serializedValue: 'false' }])).toEqual({
      rounded: false,
    });
  });
});
