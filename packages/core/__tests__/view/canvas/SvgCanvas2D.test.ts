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

import { describe, expect, test } from '@jest/globals';
import { SvgCanvas2D, constants } from '../../../src';

function createSvgCanvas2D() {
  return new SvgCanvas2D(document.createElementNS(constants.NS_SVG, 'svg'), true);
}

describe('SvgCanvas2D.convertHtml', () => {
  test.each([
    ['plain text unchanged if not valid HTML', 'plain text', 'plain text'],
    ['HTML with body tag', '<html><body><p>foo</p></body></html>', '<p>foo</p>'],
    [
      'HTML with attributes on body',
      '<html><body style="color:red"><span>bar</span></body></html>',
      '<span>bar</span>',
    ],
    ['empty string for empty input', '', ''],
    [
      'nested HTML',
      '<div><div><span>deep</span></div></div>',
      '<div><div><span>deep</span></div></div>',
    ],
    ['malformed HTML gracefully', '<div><b>broken', '<div><b>broken</b></div>'],
    [
      'HTML with whitespace, trim only leading whitespace',
      '   <div> spaced </div>   ',
      '<div> spaced </div>   ',
    ],
  ])('%s', (_description, input, expected) => {
    const canvas = createSvgCanvas2D();
    expect(canvas.convertHtml(input)).toBe(expected);
  });
});
