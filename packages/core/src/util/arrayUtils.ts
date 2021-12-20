/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
 import Point from '../view/geometry/Point';
 import Dictionary from './Dictionary';
 
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
    for (var key in b) {
      count++;
    }

    for (var key in a) {
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
export const removeDuplicates = (arr: any) => {
  const dict = new Dictionary();
  const result = [];

  for (let i = 0; i < arr.length; i += 1) {
    if (!dict.get(arr[i])) {
      result.push(arr[i]);
      dict.put(arr[i], true);
    }
  }
  return result;
};
