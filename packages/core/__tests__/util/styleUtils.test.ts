/*
Copyright 2023-present The maxGraph project Contributors

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

import { afterEach, describe, expect, test } from '@jest/globals';
import {
  parseCssNumber,
  setPrefixedStyle,
  setStyleFlag,
  setCellStyleFlags,
  setCellStyles,
} from '../../src/util/styleUtils';
import { FONT_STYLE_MASK } from '../../src/util/Constants';
import { type CellStyle, BaseGraph, Client } from '../../src';
import { createGraphWithoutPlugins } from '../utils';

describe('parseCssNumber', () => {
  test.each([
    ['thin', 2],
    ['medium', 4],
    ['thick', 6],
    ['10', 10],
    ['3.14', 3.14],
    ['-5', -5],
    ['0', 0],
    ['', 0],
    ['invalid', 0],
    ['10px', 10],
    ['1.5em', 1.5],
  ])('parses %s correctly to %d', (input, expected) => {
    expect(parseCssNumber(input)).toBe(expected);
  });
});

describe('setPrefixedStyle', () => {
  const browserFlags = ['IS_SF', 'IS_GC', 'IS_MT'] as const;
  type BrowserFlags = Partial<Record<(typeof browserFlags)[number], boolean>>;

  // Captured while the describe block is evaluated, so before any test runs and mutates them. Do not move this
  // into a beforeAll hook, which would run later and could capture values already altered by another test.
  const originalFlags = new Map(browserFlags.map((flag) => [flag, Client[flag]]));

  /** Simulates the browser detected by {@link Client}, defaulting every unset flag to `false`. */
  const simulateBrowser = (flags: BrowserFlags): void => {
    for (const flag of browserFlags) {
      Client[flag] = flags[flag] ?? false;
    }
  };

  const newStyle = (): CSSStyleDeclaration => document.createElement('div').style;

  /**
   * Reads a property by its raw name, without going through the CSSOM.
   * Vendor prefixed names are not supported by jsdom, so they only exist as plain JavaScript
   * properties on the declaration. This is what lets the tests below observe them at all.
   */
  const rawProperty = (style: CSSStyleDeclaration, name: string): string | undefined =>
    (style as unknown as Record<string, string | undefined>)[name];

  // Client flags are global mutable state, restore them so that the other tests are not impacted
  afterEach(() => {
    for (const [flag, value] of originalFlags) {
      Client[flag] = value;
    }
  });

  describe('without vendor prefix', () => {
    // The camelCase case is the regression reported in https://github.com/maxGraph/maxGraph/issues/1046
    test.each([
      ['camelCase', 'transformOrigin', 'transform-origin'],
      ['kebab-case', 'transform-origin', 'transform-origin'],
      ['single word', 'transition', 'transition'],
    ])('sets the standard property given a %s name', (_name, input, cssProperty) => {
      simulateBrowser({});
      const style = newStyle();

      setPrefixedStyle(style, input, '0px 0px');

      expect(style.getPropertyValue(cssProperty)).toBe('0px 0px');
    });

    test('does not set any vendor prefixed property', () => {
      simulateBrowser({});
      const style = newStyle();

      setPrefixedStyle(style, 'transformOrigin', '0px 0px');

      expect(rawProperty(style, 'WebkitTransformOrigin')).toBeUndefined();
      expect(rawProperty(style, 'MozTransformOrigin')).toBeUndefined();
    });
  });

  describe('with vendor prefix', () => {
    test.each([
      ['Safari', { IS_SF: true }, 'WebkitTransformOrigin'],
      ['Chrome', { IS_GC: true }, 'WebkitTransformOrigin'],
      ['Firefox', { IS_MT: true }, 'MozTransformOrigin'],
    ])(
      'sets both the standard and the prefixed property on %s',
      (_name, flags, prefixedProperty) => {
        simulateBrowser(flags);
        const style = newStyle();

        setPrefixedStyle(style, 'transformOrigin', '0px 0px');

        expect(style.getPropertyValue('transform-origin')).toBe('0px 0px');
        expect(rawProperty(style, prefixedProperty)).toBe('0px 0px');
      }
    );

    test('prefixes a single word name', () => {
      simulateBrowser({ IS_GC: true });
      const style = newStyle();

      setPrefixedStyle(style, 'transition', 'all 0.2s linear');

      expect(style.getPropertyValue('transition')).toBe('all 0.2s linear');
      expect(rawProperty(style, 'WebkitTransition')).toBe('all 0.2s linear');
    });

    test('prefers the Webkit prefix over the Moz one', () => {
      simulateBrowser({ IS_SF: true, IS_MT: true });
      const style = newStyle();

      setPrefixedStyle(style, 'transformOrigin', '0px 0px');

      expect(rawProperty(style, 'WebkitTransformOrigin')).toBe('0px 0px');
      expect(rawProperty(style, 'MozTransformOrigin')).toBeUndefined();
    });

    test('does not prefix an empty name', () => {
      simulateBrowser({ IS_GC: true });
      const style = newStyle();

      setPrefixedStyle(style, '', '0px 0px');

      expect(rawProperty(style, 'Webkit')).toBeUndefined();
    });

    // Documents the limitation warned about in the JSDoc of setPrefixedStyle: the prefix is built by
    // capitalizing the first character, which only produces a valid property name from a camelCase input.
    test('skips the prefixed property given a kebab-case name', () => {
      simulateBrowser({ IS_GC: true });
      const style = newStyle();

      setPrefixedStyle(style, 'transform-origin', '0px 0px');

      expect(style.getPropertyValue('transform-origin')).toBe('0px 0px');
      expect(rawProperty(style, 'WebkitTransformOrigin')).toBeUndefined();
      expect(rawProperty(style, 'WebkitTransform-origin')).toBe('0px 0px');
    });
  });
});

describe('setStyleFlag', () => {
  test('preserves other style properties', () => {
    const style = {
      fontStyle: FONT_STYLE_MASK.BOLD,
      fillColor: 'red',
      strokeColor: 'blue',
    };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.ITALIC, true);
    expect(style).toEqual({
      fontStyle: FONT_STYLE_MASK.BOLD | FONT_STYLE_MASK.ITALIC,
      fillColor: 'red',
      strokeColor: 'blue',
    });
  });

  test('multiple flags can be combined', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.BOLD, true);
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.ITALIC, true);
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.UNDERLINE, true);
    expect(style.fontStyle).toBe(
      FONT_STYLE_MASK.BOLD | FONT_STYLE_MASK.ITALIC | FONT_STYLE_MASK.UNDERLINE
    );
  });

  test('fontStyle undefined, set bold, no value', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.BOLD);
    expect(style.fontStyle).toBe(1);
  });
  test('fontStyle undefined, set bold, value is false', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.BOLD, false);
    expect(style.fontStyle).toBe(0);
  });
  test('fontStyle undefined, set italic, value is false', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.ITALIC, false);
    expect(style.fontStyle).toBe(0);
  });
  test('fontStyle undefined, set underline, value is true', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.UNDERLINE, true);
    expect(style.fontStyle).toBe(4);
  });
  test('fontStyle undefined, set strike-through, value is true', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.STRIKETHROUGH, true);
    expect(style.fontStyle).toBe(8);
  });

  test('fontStyle set without bold, toggle bold', () => {
    const style: CellStyle = { fontStyle: 2 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.BOLD);
    expect(style.fontStyle).toBe(3);
  });
  test('fontStyle set with bold, toggle bold', () => {
    const style: CellStyle = { fontStyle: 9 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.BOLD);
    expect(style.fontStyle).toBe(8);
  });

  test('fontStyle set without strike-through, set strike-through', () => {
    const style: CellStyle = { fontStyle: 7 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.STRIKETHROUGH, true);
    expect(style.fontStyle).toBe(15);
  });
  test('fontStyle set without strike-through, unset strike-through', () => {
    const style: CellStyle = { fontStyle: 7 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.STRIKETHROUGH, false);
    expect(style.fontStyle).toBe(7);
  });

  test('fontStyle set with underline, set underline', () => {
    const style: CellStyle = { fontStyle: 6 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.UNDERLINE, true);
    expect(style.fontStyle).toBe(6);
  });
  test('fontStyle set with underline, unset underline', () => {
    const style: CellStyle = { fontStyle: 6 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_MASK.UNDERLINE, false);
    expect(style.fontStyle).toBe(2);
  });
});

// In this test, we need a graph to have a view and ensure that the cell state is updated
test.each([
  ['BaseGraph', new BaseGraph()],
  ['Graph', createGraphWithoutPlugins()],
])('setCellStyleFlags on vertex using %s', (_name, graph) => {
  const style: CellStyle = { fontStyle: 4, spacing: 8 };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  setCellStyleFlags(
    graph.getDataModel(),
    [cell],
    'fontStyle',
    FONT_STYLE_MASK.BOLD,
    true
  );
  expect(cell.style.fontStyle).toBe(5);
  expect(graph.getView().getState(cell)?.style?.fontStyle).toBe(5);
});

// In this test, we need a graph to have a view and ensure that the cell state is updated
test.each([
  ['BaseGraph', new BaseGraph()],
  ['Graph', createGraphWithoutPlugins()],
])('setCellStyles on vertex using %s', (_name, graph) => {
  const style: CellStyle = { strokeColor: 'yellow', labelWidth: 100 };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  setCellStyles(graph.getDataModel(), [cell], 'strokeColor', 'chartreuse');
  expect(cell.style.strokeColor).toBe('chartreuse');
  expect(graph.getView().getState(cell)?.style?.strokeColor).toBe('chartreuse');
});
