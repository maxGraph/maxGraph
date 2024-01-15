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
import { convertStyleFromString } from '../../../../src/serialization/codecs/mxGraph/utils';
import { CellStyle } from '../../../../src';

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
    // To update when implementing https://github.com/maxGraph/maxGraph/issues/154
    expect(convertStyleFromString(';arcSize=4;endSize=5;')).toEqual({
      arcSize: 4,
      endSize: 5,
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
    // @ts-ignore
    expect(convertStyleFromString('autosize=1')).toEqual(<CellStyle>{
      autoSize: 1, // FIX should be true
    });
  });
});
