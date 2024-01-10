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

export function convertStyleFromString(input: string) {
  const style = {};

  // input
  //     ?.split(';')
  //     .map(entry => entry.split('='))
  //     .filter(([k]) => k === key)
  //     .map(([, v]) => v)[0] ?? defaultValue;

  const elements = input.split(';');
  // .filter(([k]) => Boolean) // TODO filter empty key
  for (let element of elements) {
    // if element doesn't contain =, it is a base style
    const [key, value] = element.split('=');

    console.info('@@convertStyleFromString key:', key);
    // @ts-ignore
    style[key] = convertToNumericIfNeeded(value);
  }

  console.info('@@convertStyleFromString input %s, return: ', input, style);
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
