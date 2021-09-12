/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import ObjectIdentity from './ObjectIdentity';

//type Dictionary<T, U> = {
//  [key: string]: U;
//};

type MapKey = string;

type Visitor<MapKey, U> = (key: MapKey, value: U) => void;

/**
 * Class: mxDictionary
 *
 * A wrapper class for an associative array with object keys. Note: This
 * implementation uses <mxObjectIdentitiy> to turn object keys into strings.
 *
 * Constructor: mxEventSource
 *
 * Constructs a new dictionary which allows object to be used as keys.
 */
class Dictionary<T, U> {
  constructor() {
    this.clear();
  }

  /**
   * Function: map
   *
   * Stores the (key, value) pairs in this dictionary.
   */
  map: Record<MapKey, U> = {};

  /**
   * Function: clear
   *
   * Clears the dictionary.
   */
  clear() {
    this.map = {};
  }

  /**
   * Function: get
   *
   * Returns the value for the given key.
   */
  get(key: T) {
    const id = ObjectIdentity.get(key);

    return this.map[id] ?? null;
  }

  /**
   * Function: put
   *
   * Stores the value under the given key and returns the previous
   * value for that key.
   */
  put(key: T, value: U) {
    const id = ObjectIdentity.get(key);
    const previous = this.map[id];
    this.map[id] = value;

    return previous ?? null;
  }

  /**
   * Function: remove
   *
   * Removes the value for the given key and returns the value that
   * has been removed.
   */
  remove(key: T) {
    const id = ObjectIdentity.get(key);
    const previous = this.map[id];
    delete this.map[id];

    return previous ?? null;
  }

  /**
   * Function: getKeys
   *
   * Returns all keys as an array.
   */
  getKeys() {
    const result = [];

    for (const key in this.map) {
      result.push(key);
    }

    return result;
  }

  /**
   * Function: getValues
   *
   * Returns all values as an array.
   */
  getValues() {
    const result = [];

    for (const key in this.map) {
      result.push(this.map[key]);
    }

    return result;
  }

  /**
   * Function: visit
   *
   * Visits all entries in the dictionary using the given function with the
   * following signature: (key, value)=> where key is a string and
   * value is an object.
   *
   * Parameters:
   *
   * visitor - A function that takes the key and value as arguments.
   */
  visit(visitor: Visitor<MapKey, U>) {
    for (const key in this.map) {
      visitor(key, this.map[key]);
    }
  }
}

export default Dictionary;
