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

import { isNumeric } from '../../../util/mathUtils.js';
import { isNullish, parseBoolean } from '../../../internal/utils.js';
import { isBooleanCellStyleProperty } from '../../boolean-attributes.js';
import type { CellStyle } from '../../../types.js';

// from mxGraph to maxGraph
const fieldMapping = new Map<string, string>([['autosize', 'autoSize']]);

export function convertStyleFromString(input: string) {
  const style: CellStyle = {};
  input.startsWith(';') && (style.ignoreDefaultStyle = true);

  const elements = input
    .split(';')
    // filter empty key
    .filter(([k]) => k);
  for (const element of elements) {
    if (!element.includes('=')) {
      !style.baseStyleNames && (style.baseStyleNames = []);
      style.baseStyleNames.push(element);
    } else {
      const [key, value] = element.split('=');
      // The property name, not the mxGraph key, decides how the value is converted
      const property = fieldMapping.get(key) ?? key;
      // @ts-ignore
      style[property] = convertValueFromString(property, value);
    }
  }

  return style;
}

/**
 * Converts a serialized style value, using the property it is assigned to.
 *
 * A boolean property is the only case where the value alone is not enough: `1` is indistinguishable from a number by
 * shape, so {@link isBooleanCellStyleProperty} has to be consulted. Everything else keeps the historical rule, a
 * numeric looking value becomes a number and anything else stays a string.
 *
 * An unrecognized token on a boolean property, `rounded=yes` for instance, falls through to that historical rule
 * rather than being defaulted, so it keeps the behavior it has always had.
 *
 * The caller must pass the maxGraph property name, not the raw mxGraph key: the two differ for the properties in
 * {@link fieldMapping}, and the boolean properties are named after the {@link CellStyle} interface.
 */
function convertValueFromString(
  property: string,
  value: string
): boolean | string | number {
  if (isBooleanCellStyleProperty(property)) {
    const booleanValue = parseBoolean(value);
    if (!isNullish(booleanValue)) {
      return booleanValue;
    }
  }
  return convertToNumericIfNeeded(value);
}

function convertToNumericIfNeeded(value: string): string | number {
  // Adapted from ObjectCodec.convertAttributeFromXml
  if (!isNumeric(value)) {
    return value;
  }

  let numericValue = Number.parseFloat(value);

  if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) {
    numericValue = 0;
  }
  return numericValue;
}
