/*
Copyright 2022-present The maxGraph project Contributors

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
import { CellStateStyle, CellStyle, Stylesheet } from '../../../src';
import { NONE } from '../../../src/util/Constants';

/**
 * Additional properties to test extension points by extending `CellStyle` and `CustomCellStateStyle`.
 */
type CustomStyleAdditions = {
  customProp1: number;
  customProp2: string;
};
type CustomCellStyle = CellStyle & CustomStyleAdditions;
type CustomCellStateStyle = CellStateStyle & CustomStyleAdditions;

// Here we just check that the default styles are initialized, and some properties set
// We don't test all properties on purpose
describe('Default styles', () => {
  test('Default edge style is set', () => {
    expect(new Stylesheet().getDefaultEdgeStyle()).toEqual(
      expect.objectContaining(<CellStyle>{
        align: 'center',
        endArrow: 'classic',
        shape: 'connector',
      })
    );
  });

  test('Default vertex style is set', () => {
    expect(new Stylesheet().getDefaultVertexStyle()).toEqual(
      expect.objectContaining(<CellStyle>{
        align: 'center',
        fillColor: '#C3D9FF',
        shape: 'rectangle',
      })
    );
  });
});

describe('putCellStyle', () => {
  test('a vertex style', () => {
    const style: CellStyle = { shape: 'rectangle', fillColor: 'red' };
    const stylesheet = new Stylesheet();
    stylesheet.putCellStyle('aVertexStyle', style);
    expect(stylesheet.styles.get('aVertexStyle')).toBe(style);
  });
});

describe('getCellStyle', () => {
  test.each([undefined, []])('baseStyleNames=%s', (baseStyleNames) => {
    const stylesheet = new Stylesheet();
    const cellStyle = stylesheet.getCellStyle(
      {
        baseStyleNames,
        fillColor: 'red',
        shape: 'triangle',
        strokeColor: 'yellow',
      },
      { align: 'center', strokeColor: 'green' }
    );
    expect(cellStyle).toStrictEqual(<CellStateStyle>{
      align: 'center', // from default
      fillColor: 'red',
      shape: 'triangle',
      strokeColor: 'yellow', // from style
    });
  });

  test('baseStyleNames set and related styles are registered', () => {
    const stylesheet = new Stylesheet();
    stylesheet.putCellStyle('style-1', { shape: 'triangle', fillColor: 'blue' });

    const cellStyle = stylesheet.getCellStyle(
      {
        baseStyleNames: ['style-1'],
        shape: 'cloud',
        strokeColor: 'yellow',
      },
      { strokeColor: 'green', dashed: true }
    );
    expect(cellStyle).toStrictEqual(<CellStateStyle>{
      dashed: true, // from default
      fillColor: 'blue', // from style-1
      shape: 'cloud', // from style (override default and style-1)
      strokeColor: 'yellow',
    });
  });

  test('baseStyleNames set and related styles are registered or not', () => {
    const stylesheet = new Stylesheet();
    stylesheet.putCellStyle('style-1', {
      shape: 'triangle',
      fillColor: 'blue',
      fillOpacity: 80,
    });
    stylesheet.putCellStyle('style2', {
      arcSize: 6,
      fillColor: 'black',
      fillOpacity: 75,
      shape: 'custom-shape',
    });
    stylesheet.putCellStyle('style3', { fillColor: 'chartreuse' });

    const cellStyle = stylesheet.getCellStyle(
      {
        baseStyleNames: ['style-1', 'unknown', 'style2', 'style3'],
        endArrow: 'custom-arrow-end',
        startArrow: 'custom-arrow-start',
        strokeColor: 'yellow',
      },
      { strokeColor: 'green', dashed: true }
    );
    expect(cellStyle).toStrictEqual(<CellStateStyle>{
      arcSize: 6, // from style2
      dashed: true, // from default
      endArrow: 'custom-arrow-end', // from default
      fillColor: 'chartreuse', // from style3 (latest in baseStyleNames)
      fillOpacity: 75, // from style2 (latest in  baseStyleNames having this property)
      shape: 'custom-shape', // from style2 (override default and style-1)
      startArrow: 'custom-arrow-start', // from default
      strokeColor: 'yellow',
    });
  });

  test('Setting undefined properties, there are filtered in the computed "getStyle"', () => {
    const stylesheet = new Stylesheet();
    const cellStyle = stylesheet.getCellStyle(
      {
        align: undefined,
        shape: 'cloud',
        strokeColor: undefined,
      },
      { arcSize: 5 }
    );
    expect(cellStyle).toStrictEqual({
      arcSize: 5, // from default
      shape: 'cloud',
    });
  });

  // This was the mxGraph behaviour
  // Setting a null/undefined value with mxUtils.setStyle remove the key from the cell style (in the string form). As it was not present in the style, it felt back to values from the default or base style.
  // See https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/src/js/util/mxUtils.js#L3465-L3478
  test('Setting undefined properties fallback to property value of the default style', () => {
    const stylesheet = new Stylesheet();
    const cellStyle = stylesheet.getCellStyle(
      {
        align: undefined,
        shape: 'cloud',
        strokeColor: undefined,
      },
      { strokeColor: 'red', align: 'left' }
    );
    expect(cellStyle).toStrictEqual({
      align: 'left',
      shape: 'cloud',
      strokeColor: 'red',
    });
  });

  // This was the mxGraph behaviour (same as fallback to value in the default style)
  test('Setting undefined properties fallback to property value of the "base" styles', () => {
    const stylesheet = new Stylesheet();
    stylesheet.putCellStyle('style-1', {
      shape: 'triangle',
      fillColor: 'blue',
      fillOpacity: 80,
    });

    const cellStyle = stylesheet.getCellStyle(
      {
        baseStyleNames: ['style-1'],
        fillColor: undefined,
        fillOpacity: undefined,
        shape: 'cloud',
      },
      {}
    );
    expect(cellStyle).toStrictEqual({
      fillColor: 'blue',
      fillOpacity: 80,
      shape: 'cloud',
    });
  });

  // This was the mxGraph behaviour, see https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/src/js/view/mxStylesheet.js#L236-L239
  test('Setting properties with "none" value fallback to property value of the default and "base" styles', () => {
    const stylesheet = new Stylesheet();
    stylesheet.putCellStyle('style-1', {
      fillColor: 'orange',
    });

    const cellStyle = stylesheet.getCellStyle(
      {
        baseStyleNames: ['style-1'],
        fillColor: NONE,
        shape: 'cloud',
        strokeColor: NONE,
      },
      { strokeColor: 'pink' }
    );
    expect(cellStyle).toStrictEqual({
      fillColor: 'orange',
      shape: 'cloud',
      strokeColor: 'pink',
    });
  });

  // This was the mxGraph behaviour
  test('Setting undefined properties in "base" style, set the property to undefined in the style', () => {
    const stylesheet = new Stylesheet();
    stylesheet.putCellStyle('style-1', {
      fillColor: undefined,
      fillOpacity: 80,
    });

    const cellStyle = stylesheet.getCellStyle(
      {
        baseStyleNames: ['style-1'],
      },
      { fillColor: 'yellow', shape: 'cloud' }
    );
    expect(cellStyle).toStrictEqual({
      fillColor: undefined,
      fillOpacity: 80,
      shape: 'cloud',
    });
  });

  test('Custom CellStyle type - baseStyleNames set and related styles are registered', () => {
    const stylesheet = new Stylesheet();
    stylesheet.putCellStyle('style-1', <CustomCellStyle>{
      customProp1: 100,
      shape: 'triangle',
    });

    const cellStyle = stylesheet.getCellStyle(
      {
        baseStyleNames: ['style-1'],
        shape: 'cloud',
        strokeColor: 'yellow',
      },
      <CustomCellStyle>{ strokeColor: 'green', customProp1: 10, customProp2: 'value' }
    );
    expect(cellStyle).toStrictEqual(<CustomCellStateStyle>{
      customProp1: 100, // from style-1
      customProp2: 'value', // from default
      shape: 'cloud',
      strokeColor: 'yellow',
    });
  });
});
