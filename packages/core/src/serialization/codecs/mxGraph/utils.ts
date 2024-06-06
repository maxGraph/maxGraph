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

import { isNumeric } from '../../../util/mathUtils';
import type { CellStyle } from '../../../types';

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
      // @ts-ignore
      style[fieldMapping.get(key) ?? key] = convertToNumericIfNeeded(value);
    }
  }

  return style;
}

function convertToNumericIfNeeded(value: string): string | number {
  // Adapted from ObjectCodec.convertAttributeFromXml
  if (!isNumeric(value)) {
    return value;
  }

  let numericValue = parseFloat(value);

  if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) {
    numericValue = 0;
  }
  return numericValue;
}
