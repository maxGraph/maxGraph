/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import Point from '../view/geometry/Point';

import type { Properties } from '../types';

/**
 * Removes all occurrences of the given object in the given array or
 * object. If there are multiple occurrences of the object, be they
 * associative or as an array entry, all occurrences are removed from
 * the array or deleted from the object. By removing the object from
 * the array, all elements following the removed element are shifted
 * by one step towards the beginning of the array.
 *
 * The length of arrays is not modified inside this function.
 *
 * @param obj Object to find in the given array.
 * @param array Array to check for the given obj.
 */
export const remove = (obj: object, array: object[]) => {
  let result = null;

  if (typeof array === 'object') {
    let index = array.indexOf(obj);

    while (index >= 0) {
      array.splice(index, 1);
      result = obj;
      index = array.indexOf(obj);
    }
  }

  for (const key in array) {
    if (array[key] == obj) {
      delete array[key];
      result = obj;
    }
  }

  return result;
};

/**
 * Compares all Point in the given lists.
 *
 * @param a Array of <Point> to be compared.
 * @param b Array of <Point> to be compared.
 */
export const equalPoints = (a: (Point | null)[] | null, b: (Point | null)[] | null) => {
  if ((!a && b) || (a && !b) || (a && b && a.length != b.length)) {
    return false;
  }

  if (a && b) {
    for (let i = 0; i < a.length; i += 1) {
      const p = a[i];

      if (!p || (p && !p.equals(b[i]))) return false;
    }
  }
  return true;
};

/**
 * Returns true if all properties of the given objects are equal. Values
 * with NaN are equal to NaN and unequal to any other value.
 *
 * @param a First object to be compared.
 * @param b Second object to be compared.
 */
export const equalEntries = (a: Properties | null, b: Properties | null) => {
  // Counts keys in b to check if all values have been compared
  let count = 0;

  if ((!a && b) || (a && !b) || (a && b && a.length != b.length)) {
    return false;
  }
  if (a && b) {
    for (const key in b) {
      count++;
    }

    for (const key in a) {
      count--;

      if ((!Number.isNaN(a[key]) || !Number.isNaN(b[key])) && a[key] !== b[key]) {
        return false;
      }
    }
  }
  return count === 0;
};

/**
 * Removes all duplicates from the given array.
 */
export const removeDuplicates = (arr: any[]): any[] => {
  const coveredEntries = new Map();
  const result = [];

  for (let i = 0; i < arr.length; i += 1) {
    if (!coveredEntries.get(arr[i])) {
      result.push(arr[i]);
      coveredEntries.set(arr[i], true);
    }
  }
  return result;
};
