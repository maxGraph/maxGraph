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
  registerCoreCodecs,
  registerCustomBooleanCellStylePropertiesForCodecs,
  Stylesheet,
  unregisterAllCodecs,
  unregisterAllCustomBooleanCellStylePropertiesForCodecs,
} from '../../src';
import { convertStyleFromString } from '../../src/serialization/codec/mxGraph/utils';
import { importToObject } from './codec/shared';
import type { BooleanCellStyleKeys } from '../../src';

/**
 * Stands for a property an application declares by module augmentation of `CellStateStyle`.
 *
 * Cast rather than actually augmented here: an augmentation in this compilation would add the property to
 * `BooleanCellStyleKeys` and therefore break the exhaustiveness assertion of `boolean-attributes.ts`, which asserts
 * that the list covers every boolean property the LIBRARY declares. The consumer side of the contract, that an
 * augmented property is accepted by the registration and a misspelled one is not, is compile checked from outside
 * this package in `packages/ts-support`.
 */
const customFlag = 'myCustomFlag' as BooleanCellStyleKeys;
const customCount = 'myCustomCount';

const decodeFromStyleString = (style: string): object => convertStyleFromString(style);

const decodeFromXmlAttributes = (attributes: string): object => {
  const style = {};
  importToObject(style, `<Object ${attributes} />`);
  return style;
};

const decodeFromStylesheetEntry = (property: string, value: string): unknown => {
  const stylesheet = new Stylesheet();
  importToObject(
    stylesheet,
    `<Stylesheet><add as="aStyle"><add value="${value}" as="${property}" /></add></Stylesheet>`
  );
  return stylesheet.styles.get('aStyle');
};

beforeAll(() => {
  unregisterAllCodecs();
});
beforeEach(() => {
  registerCoreCodecs();
});
afterEach(() => {
  unregisterAllCodecs();
  unregisterAllCustomBooleanCellStylePropertiesForCodecs();
});

describe('a property declared by the application', () => {
  test.each([
    ['1', true],
    ['0', false],
    ['true', true],
    ['false', false],
  ])('is decoded as a boolean from %s on the three decode paths', (value, expected) => {
    registerCustomBooleanCellStylePropertiesForCodecs(customFlag);

    expect(decodeFromStyleString(`myCustomFlag=${value}`)).toEqual({
      myCustomFlag: expected,
    });
    expect(decodeFromXmlAttributes(`myCustomFlag="${value}"`)).toEqual({
      myCustomFlag: expected,
    });
    expect(decodeFromStylesheetEntry('myCustomFlag', value)).toEqual({
      myCustomFlag: expected,
    });
  });

  test('is decoded as a number while it is not declared', () => {
    expect(decodeFromStyleString('myCustomFlag=1')).toEqual({ myCustomFlag: 1 });
    expect(decodeFromXmlAttributes('myCustomFlag="1"')).toEqual({ myCustomFlag: 1 });
    expect(decodeFromStylesheetEntry('myCustomFlag', '1')).toEqual({ myCustomFlag: 1 });
  });

  test('is decoded as a number again once the declarations are cleared', () => {
    registerCustomBooleanCellStylePropertiesForCodecs(customFlag);
    unregisterAllCustomBooleanCellStylePropertiesForCodecs();

    expect(decodeFromStyleString('myCustomFlag=1')).toEqual({ myCustomFlag: 1 });
  });

  test('does not affect a property of another type', () => {
    registerCustomBooleanCellStylePropertiesForCodecs(customFlag);

    expect(decodeFromStyleString(`${customCount}=1`)).toEqual({ myCustomCount: 1 });
  });
});

describe('the properties the library declares', () => {
  test('are decoded as booleans without any registration', () => {
    expect(decodeFromStyleString('rounded=1;shadow=0')).toEqual({
      rounded: true,
      shadow: false,
    });
  });

  test('are still decoded as booleans once the declarations are cleared', () => {
    registerCustomBooleanCellStylePropertiesForCodecs(customFlag);
    unregisterAllCustomBooleanCellStylePropertiesForCodecs();

    expect(decodeFromStyleString('rounded=1')).toEqual({ rounded: true });
    expect(decodeFromXmlAttributes('rounded="1"')).toEqual({ rounded: true });
    expect(decodeFromStylesheetEntry('rounded', '1')).toEqual({ rounded: true });
  });
});
