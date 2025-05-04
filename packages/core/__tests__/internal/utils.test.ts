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

import { describe, expect, test } from '@jest/globals';
import { DIRECTION_MASK, FONT_STYLE_MASK } from '../../src/util/Constants';
import { matchBinaryMask } from '../../src/internal/utils';

describe('matchBinaryMask', () => {
  test('match self', () => {
    expect(
      matchBinaryMask(FONT_STYLE_MASK.STRIKETHROUGH, FONT_STYLE_MASK.STRIKETHROUGH)
    ).toBeTruthy();
  });
  test('match', () => {
    expect(matchBinaryMask(9465, FONT_STYLE_MASK.BOLD)).toBeTruthy();
    expect(9465 & FONT_STYLE_MASK.BOLD).toBeTruthy(); // equivalent implementation returning a number (matchBinaryMask returns a boolean)
  });
  test('match another', () => {
    expect(matchBinaryMask(19484, FONT_STYLE_MASK.UNDERLINE)).toBeTruthy();
  });
  test('no match', () => {
    expect(matchBinaryMask(46413, FONT_STYLE_MASK.ITALIC)).toBeFalsy();
    expect(46413 & FONT_STYLE_MASK.ITALIC).toBeFalsy(); // equivalent implementation returning a number (matchBinaryMask returns a boolean)
  });

  test.each([null, undefined])('no match when value is nullish: %s', (value) => {
    expect(matchBinaryMask(value, DIRECTION_MASK.EAST)).toBeFalsy();
  });
  test.each([null, undefined])('match for zero when value is nullish: %s', (value) => {
    expect(matchBinaryMask(value, 0)).toBeTruthy();
  });
});
