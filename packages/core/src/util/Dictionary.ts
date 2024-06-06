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

import type { IdentityFunction, IdentityObject } from '../types';
import ObjectIdentity from './ObjectIdentity';

type MapKey = string;

type Visitor<MapKey, U> = (key: MapKey, value: U) => void;

/**
 * A wrapper class for an associative array with object keys.
 *
 * Note: This implementation uses {@link ObjectIdentity} to turn object keys into strings.
 *
 */
class Dictionary<T extends IdentityObject | IdentityFunction | null, U> {
  constructor() {
    this.clear();
  }

  /**
   * Stores the (key, value) pairs in this dictionary.
   */
  map: Record<MapKey, U> = {};

  /**
   * Clears the dictionary.
   */
  clear() {
    this.map = {};
  }

  /**
   * Returns the value for the given key.
   */
  get(key: T) {
    const id = <string>ObjectIdentity.get(key);
    return this.map[id] ?? null;
  }

  /**
   * Stores the value under the given key and returns the previous
   * value for that key.
   */
  put(key: T, value: U) {
    const id = <string>ObjectIdentity.get(key);
    const previous = this.map[id];
    this.map[id] = value;
    return previous ?? null;
  }

  /**
   * Removes the value for the given key and returns the value that
   * has been removed.
   */
  remove(key: T) {
    const id = <string>ObjectIdentity.get(key);
    const previous = this.map[id];
    delete this.map[id];
    return previous ?? null;
  }

  /**
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
   * Visits all entries in the dictionary using the given function with the
   * following signature: (key, value)=> where key is a string and
   * value is an object.
   *
   * @param visitor A function that takes the key and value as arguments.
   */
  visit(visitor: Visitor<MapKey, U>) {
    for (const key in this.map) {
      visitor(key, this.map[key]);
    }
  }
}

export default Dictionary;
