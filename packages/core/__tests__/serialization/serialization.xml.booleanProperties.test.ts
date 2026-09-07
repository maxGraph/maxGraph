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

import { afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import {
  GraphDataModel,
  ModelXmlSerializer,
  registerCoreCodecs,
  unregisterAllCodecs,
} from '../../src';
import { ModelChecker } from './utils';
import { importToObject } from './codec/shared';
import {
  allBooleanCellStyleCases,
  booleanCellStyleCasesFor,
  buildExpectedStyle,
  coerceNumericLookingValue,
  serializedBooleanValues,
  type BooleanCellStyleCase,
  type SerializedBooleanValue,
} from './boolean-style-properties';

/**
 * Expected value of a boolean property decoded from an XML attribute.
 *
 * Characterizes the current, WRONG behavior of `ObjectCodec.convertAttributeFromXml`, which decides from the shape of
 * the value and never from the type of the target property, so `rounded="1"` becomes the number 1 rather than `true`.
 * The fix flips this function, which is what turns the whole matrix below back to green.
 */
const decodedFromXmlAttribute = (serializedValue: SerializedBooleanValue): unknown =>
  coerceNumericLookingValue(serializedValue);

const buildStyleXmlAttributes = (cases: readonly BooleanCellStyleCase[]): string =>
  cases.map(({ key, serializedValue }) => `${key}="${serializedValue}"`).join(' ');

const namedCases = (
  cases: readonly BooleanCellStyleCase[]
): readonly [string, BooleanCellStyleCase][] =>
  cases.map((booleanCase) => [
    `${booleanCase.key}="${booleanCase.serializedValue}"`,
    booleanCase,
  ]);

// Prevents side effects between tests
beforeAll(() => {
  unregisterAllCodecs();
});
afterEach(() => {
  unregisterAllCodecs();
});

describe('decode boolean style properties from an Object element', () => {
  // ModelXmlSerializer is not involved here, so the codecs must be registered explicitly
  beforeEach(() => {
    registerCoreCodecs();
  });

  const decodeStyle = (cases: readonly BooleanCellStyleCase[]): object => {
    const style = {};
    importToObject(style, `<Object ${buildStyleXmlAttributes(cases)} />`);
    return style;
  };

  test.each(serializedBooleanValues)('all properties serialized as %s', (value) => {
    const cases = booleanCellStyleCasesFor(value);
    expect(decodeStyle(cases)).toEqual(
      buildExpectedStyle(cases, decodedFromXmlAttribute)
    );
  });

  test.each(namedCases(allBooleanCellStyleCases))('%s', (_name, booleanCase) => {
    expect(decodeStyle([booleanCase])).toEqual(
      buildExpectedStyle([booleanCase], decodedFromXmlAttribute)
    );
  });
});

describe('decode boolean style properties from the style of a Cell', () => {
  const decodeStyleOfVertex = (
    cases: readonly BooleanCellStyleCase[]
  ): GraphDataModel => {
    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(
      `<GraphDataModel>
  <root>
    <Cell id="0">
      <Object as="style" />
    </Cell>
    <Cell id="1" parent="0">
      <Object as="style" />
    </Cell>
    <Cell id="cell-1" vertex="1" parent="1">
      <Object ${buildStyleXmlAttributes(cases)} as="style" />
    </Cell>
  </root>
</GraphDataModel>`
    );
    return model;
  };

  const expectDecodedStyle = (cases: readonly BooleanCellStyleCase[]): void => {
    const model = decodeStyleOfVertex(cases);
    const modelChecker = new ModelChecker(model);
    modelChecker.checkRootCells();
    modelChecker.checkCellsCount(3);
    modelChecker.expectIsVertex(model.getCell('cell-1'), null, {
      style: buildExpectedStyle(cases, decodedFromXmlAttribute),
    });
  };

  test.each(serializedBooleanValues)('all properties serialized as %s', (value) => {
    expectDecodedStyle(booleanCellStyleCasesFor(value));
  });

  test.each(namedCases(allBooleanCellStyleCases))('%s', (_name, booleanCase) => {
    expectDecodedStyle([booleanCase]);
  });
});
