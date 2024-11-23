/*
Copyright 2021-present The maxGraph project Contributors

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

import ObjectIdentity from './ObjectIdentity';

/**
 * Recursively clones the specified object ignoring all field names in the
 * given array of transient fields. {@link ObjectIdentity#FIELD_NAME} is always
 * ignored by this function.
 *
 * @param obj Object to be cloned.
 * @param transients Optional array of strings representing the fieldname to be
 * ignored.
 * @param shallow Optional boolean argument to specify if a shallow clone should
 * be created, that is, one where all object references are not cloned or,
 * in other words, one where only atomic (strings, numbers) values are
 * cloned. Default is false.
 */
export const clone = function _clone(
  obj: any,
  transients: string[] | null = null,
  shallow = false
) {
  shallow = shallow != null ? shallow : false;
  let clone = null;

  if (obj != null && typeof obj.constructor === 'function') {
    clone = new obj.constructor();

    for (const i in obj) {
      if (
        i != ObjectIdentity.FIELD_NAME &&
        (transients == null || transients.indexOf(i) < 0)
      ) {
        if (!shallow && typeof obj[i] === 'object') {
          clone[i] = _clone(obj[i]);
        } else {
          clone[i] = obj[i];
        }
      }
    }
  }

  return clone;
};

/**
 * Shallow copies properties from the source object to the target object.
 *
 * **WARNING**: This function performs only a **shallow** copy i.e. there is no deep copy of the properties that are objects.
 *
 * @template T The type of the objects.
 *
 * @param source The source object from which properties will be copied.
 * @param target The target object to which properties will be copied.
 *
 * @private not part of the public API, can be removed or changed without prior notice
 * @since 0.14.0
 */
export const shallowCopy = <T>(source: T, target: T) => {
  for (const key in source) {
    // attempt to prevent prototype pollution
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
};
