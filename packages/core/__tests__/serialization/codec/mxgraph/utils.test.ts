/*
Copyright 2024-present The maxGraph project Contributors

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

import { describe, expect, test } from '@jest/globals';
import { convertStyleFromString } from '../../../../src/serialization/codec/mxGraph/utils';
import type { CellStyle } from '../../../../src';
import {
  allBooleanCellStyleCases,
  booleanCellStyleCasesFor,
  buildExpectedStyle,
  coerceNumericLookingValue,
  serializedBooleanValues,
  type BooleanCellStyleCase,
  type SerializedBooleanValue,
} from '../../boolean-style-properties';

/**
 * Expected value when a boolean property is decoded from an mxGraph style string.
 *
 * Characterizes the CURRENT WRONG behavior of {@link convertStyleFromString}: a numeric looking value becomes a
 * number and anything else stays a string, so a property declared as `boolean` never decodes to a boolean. Flipping
 * this function is how the fix turns these tests green again.
 */
const decodedFromStyleString = (serializedValue: SerializedBooleanValue): unknown =>
  coerceNumericLookingValue(serializedValue);

const buildStyleString = (cases: readonly BooleanCellStyleCase[]): string =>
  cases.map(({ key, serializedValue }) => `${key}=${serializedValue}`).join(';');

describe('convertStyleFromString', () => {
  test('Basic', () => {
    // adapted from https://github.com/maxGraph/maxGraph/issues/221
    expect(
      convertStyleFromString(
        'rounded=0;whiteSpace=wrap;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=27'
      )
    ).toEqual({
      rounded: 0, // FIX should be true
      whiteSpace: 'wrap',
      fillColor: '#dae8fc',
      strokeColor: '#6c8ebf',
      fontStyle: 1,
      fontSize: 27,
    });
  });

  test('With leading ;', () => {
    expect(convertStyleFromString(';arcSize=4;endSize=5;')).toEqual(<CellStyle>{
      arcSize: 4,
      endSize: 5,
      ignoreDefaultStyle: true,
    });
  });

  test('With trailing ;', () => {
    // from https://github.com/maxGraph/maxGraph/issues/102#issuecomment-1225577772
    expect(
      convertStyleFromString(
        'rounded=0;whiteSpace=wrap;html=1;fillColor=#E6E6E6;dashed=1;'
      )
    ).toEqual({
      rounded: 0, // FIX should be true
      whiteSpace: 'wrap',
      html: 1, // custom draw.io
      fillColor: '#E6E6E6',
      dashed: 1,
    });
  });

  // manage base name style (no = at the begining and in the middle)
  test('With base name style', () => {
    expect(
      convertStyleFromString(
        'rectangle;fontColor=yellow;customRectangle;gradientColor=white;'
      )
    ).toEqual(<CellStyle>{
      baseStyleNames: ['rectangle', 'customRectangle'],
      fontColor: 'yellow',
      gradientColor: 'white',
    });
  });

  // renamed properties (see migration guide)
  test('With renamed properties', () => {
    expect(convertStyleFromString('autosize=1')).toEqual({
      autoSize: 1, // FIX should be true
    });
  });

  // Characterization of the current behavior for every property declared as boolean: all of them decode to a number
  // or to a string, never to a boolean. The expectations are flipped once the parser converts them.
  describe('all boolean properties', () => {
    test.each(
      serializedBooleanValues.map(
        (serializedValue) =>
          [`serialized as ${serializedValue}`, serializedValue] as const
      )
    )('every boolean property at once, %s', (_description, serializedValue) => {
      const cases = booleanCellStyleCasesFor(serializedValue);

      expect(convertStyleFromString(buildStyleString(cases))).toEqual(
        buildExpectedStyle(cases, decodedFromStyleString)
      );
    });

    test.each(
      allBooleanCellStyleCases.map(
        (styleCase) =>
          [`${styleCase.key}=${styleCase.serializedValue}`, styleCase] as const
      )
    )('%s', (_description, styleCase) => {
      expect(convertStyleFromString(buildStyleString([styleCase]))).toEqual(
        buildExpectedStyle([styleCase], decodedFromStyleString)
      );
    });

    // The mxGraph name is 'autosize' while the maxGraph property is 'autoSize', renamed by the fieldMapping of the
    // parser. The boolean conversion must look the property up under its mapped name, otherwise this one property
    // keeps decoding as a number once the others are fixed.
    test.each(
      serializedBooleanValues.map(
        (serializedValue) => [`autosize=${serializedValue}`, serializedValue] as const
      )
    )(
      '%s is decoded as the renamed autoSize property',
      (_description, serializedValue) => {
        expect(convertStyleFromString(`autosize=${serializedValue}`)).toEqual({
          autoSize: decodedFromStyleString(serializedValue),
        });
      }
    );
  });
});
