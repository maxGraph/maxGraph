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

import SvgCanvas2D from '../../../src/view/canvas/SvgCanvas2D.js';
import { NS_SVG } from '../../../src/util/Constants.js';

describe('SvgCanvas2D.convertHtml', () => {
  // Helper to create a dummy SVG root
  function createSvgCanvas2D() {
    return new SvgCanvas2D(document.createElementNS(NS_SVG, 'svg'), true);
  }

  test('returns plain text unchanged if not valid HTML', () => {
    const canvas = createSvgCanvas2D();
    const input = 'plain text';
    expect(canvas.convertHtml(input)).toBe('plain text');
  });

  test('handles HTML with body tag', () => {
    const canvas = createSvgCanvas2D();
    const input = '<html><body><p>foo</p></body></html>';
    expect(canvas.convertHtml(input)).toBe('<p>foo</p>');
  });

  test('handles HTML with attributes on body', () => {
    const canvas = createSvgCanvas2D();
    const input = '<html><body style="color:red"><span>bar</span></body></html>';
    expect(canvas.convertHtml(input)).toBe('<span>bar</span>');
  });

  test('returns empty string for empty input', () => {
    const canvas = createSvgCanvas2D();
    expect(canvas.convertHtml('')).toBe('');
  });

  test('handles nested HTML', () => {
    const canvas = createSvgCanvas2D();
    const input = '<div><div><span>deep</span></div></div>';
    expect(canvas.convertHtml(input)).toBe('<div><div><span>deep</span></div></div>');
  });

  test('handles malformed HTML gracefully', () => {
    const canvas = createSvgCanvas2D();
    const input = '<div><b>broken';
    expect(canvas.convertHtml(input)).toBe('<div><b>broken</b></div>');
  });

  test('handles HTML with whitespace', () => {
    const canvas = createSvgCanvas2D();
    const input = '   <div> spaced </div>   ';
    expect(canvas.convertHtml(input).trim()).toBe('<div> spaced </div>');
  });
});
